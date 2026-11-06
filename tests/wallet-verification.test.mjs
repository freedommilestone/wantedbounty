import test from 'node:test';
import assert from 'node:assert/strict';
import {ed25519} from '@noble/curves/ed25519';
import {newChallenge,verifyWalletSignature,parseHoldings,BERI_MINT,validCron,walletSummary,scanWallet} from '../server/wallet-verification.js';
import handler from '../server/handlers/wallet-verification.js';
function base58(bytes){let n=BigInt('0x'+Buffer.from(bytes).toString('hex')),s='';const abc='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';while(n){s=abc[Number(n%58n)]+s;n/=58n;}for(const b of bytes){if(b)break;s='1'+s;}return s;}
const key=new Uint8Array(32).fill(7),address=base58(ed25519.getPublicKey(key));
const user='11111111-1111-4111-8111-111111111111';
const challenge=()=>({...newChallenge(user,address),user_id:user,address,expires_at:new Date(Date.now()+300000).toISOString(),used_at:null});
test('wallet proof is bound to exact server message, account and address',()=>{
 const c=challenge(),signature=Buffer.from(ed25519.sign(new TextEncoder().encode(c.message),key)).toString('base64');
 verifyWalletSignature(c,user,signature);
 for(const altered of [{...c,user_id:'someone-else'},{...c,used_at:new Date().toISOString()},{...c,expires_at:'2000-01-01'},{...c,message:c.message+' altered'},{...c,address:base58(ed25519.getPublicKey(new Uint8Array(32).fill(8)))}])assert.throws(()=>verifyWalletSignature(altered,user,signature));
 assert.throws(()=>verifyWalletSignature(c,user,'invalid'));assert.throws(()=>newChallenge(user,'111'));
 assert.notEqual(challenge().message,challenge().message);
});
const token=(raw='1000000',decimals=6)=>({pubkey:'account1',account:{data:{parsed:{info:{mint:BERI_MINT,owner:address,tokenAmount:{amount:raw,decimals}}}}}});
test('holding read sums all token accounts using integers, accepts an empty wallet, rejects partial/malformed RPC data',()=>{
 const t=token('9007199254740991999');assert.deepEqual(parseHoldings({context:{slot:123},value:[t,{...token('1'),pubkey:'account2'}]},address),{raw:'9007199254740992000',decimals:6,slot:123});
 assert.equal(parseHoldings({context:{slot:123},value:[]},address).raw,'0');
 for(const result of [undefined,{value:[]},{context:{slot:123},value:[t,t]},{context:{slot:123},value:[token('abc')]},{context:{slot:123},value:[t,{...token('1',9),pubkey:'account2'}]}])assert.throws(()=>parseHoldings(result,address));
 const foreign=token();foreign.account.data.parsed.info.owner='someoneelse';assert.throws(()=>parseHoldings({context:{slot:123},value:[foreign]},address));
});
test('cron requires the exact configured secret',t=>{
 const old=process.env.CRON_SECRET;t.after(()=>{if(old===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=old;});
 delete process.env.CRON_SECRET;assert.equal(validCron({headers:{authorization:'Bearer undefined'}}),false);
 process.env.CRON_SECRET='qa-cron-secret';assert.equal(validCron({headers:{authorization:'Bearer qa-cron-secret'}}),true);assert.equal(validCron({headers:{authorization:'Bearer forged'}}),false);
});
test('stale streaks are marked pending and not displayed as active; balances omit decimals',()=>{
 const link={id:'x',address,balance_raw:'1999999',decimals:6,current_streak:12,longest_streak:15,last_day:'2026-11-01'};
 const summary=walletSummary(link,Date.parse('2026-11-06T00:00:00Z'));assert.equal(summary.currentStreak,0);assert.equal(summary.previousStreak,12);assert.equal(summary.longestStreak,15);assert.equal(summary.balance,'1');assert.equal(summary.pending,true);
});
function env(t){for(const [key,value] of Object.entries({SUPABASE_URL:'https://test.supabase.co',SUPABASE_SECRET_KEY:'secret',SOLANA_RPC_URL:'https://test.solana.local'})){const old=process.env[key];process.env[key]=value;t.after(()=>{if(old===undefined)delete process.env[key];else process.env[key]=old;});}}
test('network errors never write a zero balance or advance/reset saved streaks',async t=>{
 env(t);const writes=[],link={id:'id',address,current_streak:5};
 t.mock.method(globalThis,'fetch',async(url,opts)=>{
  if(url.includes('claim_wallet_scan'))return Response.json(link);
  if(url.includes('test.solana'))return new Response(null,{status:503});
  writes.push(JSON.parse(opts.body));return new Response(null,{status:204});
 });
 const result=await scanWallet(link);assert.equal(result.failed,true);assert.equal(result.link.current_streak,5);assert.deepEqual(writes,[{check_failed:true}]);
});
test('wallet API rejects anonymous calls before touching wallet storage',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw new Error('Must not fetch');});
 let status,body;const res={setHeader(){return this;},status(value){status=value;return this;},json(value){body=value;}};
 await handler({method:'POST',headers:{},body:{action:'verify',accountId:user}},res);assert.equal(status,401);assert.match(body.error,/log in/);
});
