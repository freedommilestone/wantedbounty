import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/poster-order.js';
import { verifyTransaction,MEMO,MINTS } from '../server/verify-payment.js';
import { hash } from '../server/poster-store.js';

const id='11111111-1111-4111-8111-111111111111', token='a'.repeat(64), signature='2'.repeat(88);
const owner='3CQ2GbBy1ks8kyEpa89TV9b3LaC17FBhwR2iZUzVw4pP';
const order=()=>({id,token_hash:hash(token),owner,treasury:'treasury',currency:'SOL',amount:50000000,
  created_at:new Date(Date.now()-20000).toISOString(),expires_at:new Date(Date.now()+40000).toISOString(),
  details:{name:'Captain',condition:'ALIVE',bounty:'1,250,000'},status:'pending'});
function transaction(o) {
  return {blockTime:Math.floor(Date.now()/1000),meta:{err:null},transaction:{message:{accountKeys:[{pubkey:owner,signer:true}],instructions:[
    {programId:MEMO,parsed:`wanted:${id}`},
    {programId:'11111111111111111111111111111111',parsed:{type:'transfer',info:{source:owner,destination:o.treasury,lamports:o.amount}}},
  ]}}};
}
test('SOL verification accepts correct order-bound payment',()=>{const o=order();verifyTransaction(transaction(o),o);});
for(const [label,change] of [
  ['failed transaction',t=>t.meta.err={}],['missing memo',t=>t.transaction.message.instructions.shift()],
  ['wrong order',t=>t.transaction.message.instructions[0].parsed='wanted:other'],
  ['wrong amount',t=>t.transaction.message.instructions[1].parsed.info.lamports=1],
  ['wrong recipient',t=>t.transaction.message.instructions[1].parsed.info.destination='attacker'],
  ['unsigned buyer',t=>t.transaction.message.accountKeys[0].signer=false],
  ['old transaction',t=>t.blockTime-=3600],
]) test(`reject ${label}`,()=>{const o=order(),tx=transaction(o);change(tx);assert.throws(()=>verifyTransaction(tx,o));});
test('stablecoin requires correct mint, decimals and treasury balance increase',()=>{
 const o={...order(),currency:'USDC',amount:5000000},tx=transaction(o);
 tx.transaction.message.accountKeys.push({pubkey:'ata',signer:false});
 tx.transaction.message.instructions[1]={programId:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',parsed:{type:'transferChecked',info:{authority:owner,mint:MINTS.USDC,destination:'ata',tokenAmount:{amount:'5000000',decimals:6}}}};
 tx.meta.postTokenBalances=[{accountIndex:1,owner:o.treasury,mint:MINTS.USDC,uiTokenAmount:{amount:'5000000'}}];
 verifyTransaction(tx,o);
 tx.meta.postTokenBalances[0].owner='attacker';assert.throws(()=>verifyTransaction(tx,o));
 tx.meta.postTokenBalances[0].owner=o.treasury;
 tx.transaction.message.instructions[1].parsed.info.mint=MINTS.USDT;assert.throws(()=>verifyTransaction(tx,o));
});

function env(t) {
 for(const key of ['SUPABASE_URL','SUPABASE_SECRET_KEY','CHATGPT_API_SECRET_KEY']) {
   const previous=process.env[key];process.env[key]=key==='SUPABASE_URL'?'https://test.supabase.co':'test-secret';
   t.after(()=>{if(previous===undefined)delete process.env[key];else process.env[key]=previous;});
 }
}
async function request(body) {
 const res={setHeader(){},status(n){this.code=n;return this;},json(v){this.body=v;return this;}};
 await handler({method:'POST',body,headers:{},socket:{remoteAddress:'test'}},res);return res;
}
function fakeServices(t,{providerFails=false}={}) {
 let record=order(),calls=0;const images=new Map([['input.jpg',Buffer.from([255,216,255,...new Array(100).fill(0)])]]);
 t.mock.method(globalThis,'fetch',async (url,options)=>{
   const body=options?.body && typeof options.body==='string'?JSON.parse(options.body):null;
   if(url.includes('api.mainnet'))return Response.json({result:transaction(record)});
   if(url.includes('api.openai.com')) {
     calls++;await new Promise(r=>setTimeout(r,10));
     return providerFails?new Response('failed',{status:500}):Response.json({data:[{b64_json:images.get('input.jpg').toString('base64')}]});
   }
   if(url.includes('/rpc/claim_poster_order')){
     if(record.status!=='pending')return Response.json(false);
     record={...record,status:'generating',signature:body.p_signature,started_at:new Date().toISOString()};return Response.json(true);
   }
   if(url.includes('/rest/v1/poster_orders')) {
     if(options.method==='PATCH') {Object.assign(record,body);return new Response(null,{status:204});}
     return Response.json([{...record}]);
   }
   if(url.includes('/storage/v1/object/')) {
     const name=url.split('/').at(-1);
     if(options.method==='POST'){images.set(name,options.body);return Response.json({});}
     return new Response(images.get(name));
   }
   throw Error(`Unexpected request ${url}`);
 });
 return {calls:()=>calls,record:()=>record};
}
test('missing configuration refuses checkout',async t=>{
 env(t);delete process.env.CHATGPT_API_SECRET_KEY;
 const response=await request({action:'prepare'});assert.equal(response.code,503);
});
test('wrong recovery token cannot read an order',async t=>{
 env(t);fakeServices(t);const r=await request({action:'status',id,token:'b'.repeat(64)});assert.equal(r.code,404);
});
test('concurrent generation and repeat requests call OpenAI once',async t=>{
 env(t);const services=fakeServices(t);const body={action:'generate',id,token,signature};
 const replies=await Promise.all([request(body),request(body)]);
 assert.equal(services.calls(),1);assert.ok(replies.some(r=>r.body.status==='ready'));
 const repeated=await request(body);assert.equal(repeated.body.status,'ready');assert.equal(services.calls(),1);
 assert.match(repeated.body.image,/^data:image\/jpeg;base64,/);
});
test('provider failure saves receipt for assistance and never charges/generates again',async t=>{
 env(t);const services=fakeServices(t,{providerFails:true});const body={action:'generate',id,token,signature};
 const r=await request(body);assert.equal(r.body.status,'review');assert.equal(services.record().signature,signature);
 await request(body);assert.equal(services.calls(),1);
});

test('checkout ignores client price/recipient and saves the photo before authorizing payment',async t=>{
 env(t);let stored=false;
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  if(url.includes('/rpc/prepare_poster_order')) {
   const {p_order}=JSON.parse(options.body);
   assert.equal(p_order.amount,5000000);assert.notEqual(p_order.treasury,'attacker');
   assert.equal(p_order.currency,'USDC');assert.equal(p_order.token,undefined);
   return Response.json(p_order.id);
  }
  if(url.includes('/storage/')) {stored=true;return Response.json({});}
  throw Error('Must not call AI before payment');
 });
 const photo='data:image/jpeg;base64,'+Buffer.from([255,216,255,...new Array(100).fill(0)]).toString('base64');
 const r=await request({action:'prepare',owner,currency:'USDC',amount:1,treasury:'attacker',name:'Captain',condition:'ALIVE',photo});
 assert.equal(r.code,200);assert.equal(stored,true);assert.equal(r.body.token.length,64);
});

test('storage outage blocks checkout before returning a payable order',async t=>{
 env(t);t.mock.method(globalThis,'fetch',async()=>new Response('unavailable',{status:503}));
 const photo='data:image/jpeg;base64,'+Buffer.from([255,216,255,...new Array(100).fill(0)]).toString('base64');
 const r=await request({action:'prepare',owner,currency:'USDC',name:'Captain',condition:'ALIVE',photo});
 assert.equal(r.code,503);assert.equal(r.body.id,undefined);assert.equal(r.body.token,undefined);
});
