import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyHistory,replayHistory,finishHistory,historyStart,syncHoldingHistory} from '../server/holding-history.js';
import {BERI_MINT} from '../server/wallet-verification.js';
const owner='owner',day=86400;
const side=(amount,index=0,who=owner)=>({accountIndex:index,mint:BERI_MINT,owner:who,uiTokenAmount:{amount:String(amount),decimals:6}});
function tx(slot,time,pre,post,index=0){return {slot,transactionIndex:index,blockTime:time,transaction:{message:{accountKeys:['a','b']}},meta:{err:null,preTokenBalances:pre,postTokenBalances:post}};}
function finish(s,time,accounts={a:'1000000'},slot=s.lastSlot){return finishHistory(s,{time,accounts,raw:String(Object.values(accounts).reduce((n,a)=>n+BigInt(a),0n)),slot,decimals:6});}
test('history threshold is >= 1 BERI; fractions do not unlock holding days',()=>{
 let s=replayHistory(emptyHistory(0,6),[tx(1,day,[],[side(999999)]),tx(2,3*day,[side(999999)],[side(1000000)])],owner);
 const result=finish(s,5*day);assert.equal(result.bestDays,2);assert.equal(result.currentSeconds,2*day);
});
test('sell and refill on the same day breaks continuity, but preserves best run',()=>{
 const s=replayHistory(emptyHistory(0,6),[tx(1,day,[],[side(2000000)]),tx(2,6*day,[side(2000000)],[side(0)]),tx(3,6*day+60,[side(0)],[side(1000000)])],owner);
 const result=finish(s,7*day);assert.equal(result.bestDays,5);assert.equal(result.currentSeconds,day-60);
});
test('aggregate accounts, internal transfers, closure and ownership changes reconcile',()=>{
 let s=replayHistory(emptyHistory(0,6),[tx(1,day,[],[side(2000000)]),tx(2,2*day,[side(2000000)],[side(0),side(2000000,1)]),tx(3,3*day,[side(0)],[])],owner);
 assert.equal(finish(s,4*day,{b:'2000000'}).bestDays,3);
 s=replayHistory(s,[tx(4,5*day,[side(2000000,1)],[side(2000000,1,'another-owner')])],owner);
 assert.equal(finish(s,6*day,{}).bestDays,4);assert.equal(s.currentSince,null);
});
test('resume pages and incremental checkpoints produce the same holding result',()=>{
 const first=tx(1,day,[],[side(1000000)]),second=tx(2,3*day,[side(1000000)],[side(2000000)]);
 const whole=finish(replayHistory(emptyHistory(0,6),[first,second],owner),5*day,{a:'2000000'});
 const paged=replayHistory(replayHistory(emptyHistory(0,6),[first],owner),[second],owner);
 assert.deepEqual(finish(paged,5*day,{a:'2000000'}),whole);
 const checkpoint=finish(replayHistory(emptyHistory(0,6),[first],owner),2*day).state;
 assert.deepEqual(finish(replayHistory(checkpoint,[second],owner),5*day,{a:'2000000'}),whole);
});
test('shared cutoff clips historical durations without losing opening balance',()=>{
 const s=replayHistory(emptyHistory(3*day,6),[tx(1,day,[],[side(1000000)])],owner);
 assert.equal(finish(s,5*day).bestDays,2);
 assert.equal(finish({...s,start:6*day},5*day).bestDays,0);
 assert.equal(historyStart('launch'),0);assert.equal(historyStart('2026-11-06'),Date.parse('2026-11-06T00:00:00Z')/1000);
 assert.throws(()=>historyStart('2026-02-30'));assert.throws(()=>historyStart(''));
});
test('reject gaps, duplicate/out-of-order transactions, incomplete metadata and mismatched anchors',()=>{
 const s=replayHistory(emptyHistory(0,6),[tx(1,day,[],[side(1000000)])],owner);
 assert.throws(()=>replayHistory(s,[tx(1,day,[],[side(1000000)])],owner));
 assert.throws(()=>replayHistory(s,[tx(2,day,[side(2000000)],[side(3000000)])],owner));
 assert.throws(()=>replayHistory(s,[{...tx(2,day,[],[]),blockTime:null}],owner));
 assert.throws(()=>replayHistory(s,[{...tx(2,day,[],[]),meta:null}],owner));
 assert.throws(()=>finish(s,2*day,{a:'2000000'}));assert.throws(()=>finish(s,2*day,{b:'1000000'}));
 assert.throws(()=>finish(s,day-1));
});
test('same-slot ordering preserves an intra-slot threshold break',()=>{
 const s=replayHistory(emptyHistory(0,6),[tx(1,day,[],[side(1000000)]),tx(2,4*day,[side(1000000)],[side(0)],1),tx(2,4*day,[side(0)],[side(1000000)],2)],owner);
 const result=finish(s,5*day);assert.equal(result.bestDays,3);assert.equal(result.currentSeconds,day);
});
test('v0 loaded addresses are included in token account indices',()=>{
 const t=tx(1,day,[],[side(1000000,2)]);t.meta.loadedAddresses={writable:['loaded'],readonly:[]};
 const s=replayHistory(emptyHistory(0,6),[t],owner);assert.equal(finish(s,2*day,{loaded:'1000000'}).bestDays,1);
});
test('history job persists a page, resumes without a new anchor, and never saves a failed page',async t=>{
 for(const [k,v] of Object.entries({SUPABASE_URL:'https://history-test.supabase.co',SUPABASE_SECRET_KEY:'secret',SOLANA_HISTORY_RPC_URL:'https://history-rpc.invalid',BERI_HISTORY_START_DATE:'launch'})){
  const old=process.env[k];process.env[k]=v;t.after(()=>old===undefined?delete process.env[k]:process.env[k]=old);
 }
 const address='11111111111111111111111111111111',link={id:'link-id',address};
 let record={checkpoint:null,job:null},pages=0,anchors=0,failed=0,offline=false;
 const sample=(n,before,after)=>{const value=tx(120000000+n,n*day,before===null?[]:[side(before)], [side(after)]);for(const x of [...value.meta.preTokenBalances,...value.meta.postTokenBalances])x.owner=address;return value;};
 t.mock.method(globalThis,'fetch',async(url,options)=>{
  const body=JSON.parse(options.body);
  if(url.includes('history-test.supabase.co')){
   if(url.endsWith('claim_wallet_history'))return Response.json(record);
   if(url.endsWith('save_wallet_history')){record={checkpoint:body.p_checkpoint,job:body.p_job};return Response.json(true);}
   if(url.endsWith('fail_wallet_history')){failed++;return new Response(null,{status:204});}
   throw new Error('Unexpected database request');
  }
  if(offline)throw new Error('offline');
  if(body.method==='getTransactionsForAddress'&&body.params[0]===BERI_MINT)return Response.json({result:{data:[{slot:120000000}]}});
  if(body.method==='getTokenAccountsByOwner'){
   anchors++;return Response.json({result:{context:{slot:120000003},value:[{pubkey:'a',account:{data:{parsed:{info:{mint:BERI_MINT,owner:address,tokenAmount:{amount:'2000000',decimals:6}}}}}}]}});
  }
  if(body.method==='getBlockTime')return Response.json({result:4*day});
  if(body.method==='getTransactionsForAddress'){
   pages++;assert.equal(body.params[1].filters.tokenAccounts,'all');assert.equal(body.params[1].commitment,'finalized');
   return Response.json({result:body.params[1].paginationToken?{data:[sample(2,1000000,2000000)],paginationToken:null}:{data:[sample(1,null,1000000)],paginationToken:'120000001:0'}});
  }
  throw new Error('Unexpected RPC');
 });
 assert.equal((await syncHoldingHistory(link,{maxPages:1})).status,'indexing');assert.equal(record.checkpoint,null);assert(record.job.cursor);
 assert.equal((await syncHoldingHistory(link)).status,'complete');assert.equal(record.job,null);assert.equal(record.checkpoint.bestSeconds,3*day);assert.equal(anchors,1);assert.equal(pages,2);
 const saved=structuredClone(record);offline=true;
 assert.equal((await syncHoldingHistory(link)).status,'retrying');assert.equal(failed,1);assert.deepEqual(record,saved);
});
