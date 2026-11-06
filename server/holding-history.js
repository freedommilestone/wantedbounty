import {randomUUID} from 'node:crypto';
import {BERI_MINT,parseHoldings,publicKey,walletDb} from './wallet-verification.js';

const DAY=86400;
let mintFirstSlot=null;
// A shared date, never a date chosen by a player. 'launch' replays all history.
export function historyStart(value=process.env.BERI_HISTORY_START_DATE||'launch'){
 if(value==='launch')return 0;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))throw new Error('History start date is not configured');
 const date=Date.parse(`${value}T00:00:00Z`);
 if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==value)throw new Error('Invalid history start date');
 return date/1000;
}
export function emptyHistory(start,decimals){return {start,decimals,raw:'0',accounts:{},currentSince:null,bestSeconds:0,lastSlot:-1,lastIndex:-1,lastTime:0,coverageSlot:-1,throughTime:0};}
function tokenSide(balances,keys,address,decimals){
 if(!Array.isArray(balances))throw new Error('Missing token metadata');
 const amounts=new Map();
 for(const balance of balances){
  if(balance.mint!==BERI_MINT)continue;
  const key=keys[balance.accountIndex],amount=balance.uiTokenAmount;
  if(typeof key!=='string'||!balance.owner||!amount||amount.decimals!==decimals||!/^\d{1,78}$/.test(amount.amount)||amounts.has(key))throw new Error('Incomplete token metadata');
  amounts.set(key,balance.owner===address?BigInt(amount.amount):0n);
 }
 return amounts;
}
// Process every successful transaction, including token-account closure and
// ownership changes. No transfer-only filter: it can omit mint/burn operations.
export function replayHistory(state,transactions,address){
 const s=structuredClone(state),threshold=10n**BigInt(s.decimals);
 for(const tx of transactions){
  const {slot,transactionIndex:index,blockTime}=tx;
  if(!Number.isSafeInteger(slot)||!Number.isSafeInteger(index)||slot<s.lastSlot||(slot===s.lastSlot&&index<=s.lastIndex)||slot<=s.coverageSlot)throw new Error('History order or pagination mismatch');
  if(!tx.meta||tx.meta.err!==null||!Number.isSafeInteger(blockTime)||blockTime<0)throw new Error('Incomplete finalized transaction');
  const keys=[...(tx.transaction?.message?.accountKeys||[]),...(tx.meta.loadedAddresses?.writable||[]),...(tx.meta.loadedAddresses?.readonly||[])];
  const pre=tokenSide(tx.meta.preTokenBalances,keys,address,s.decimals),post=tokenSide(tx.meta.postTokenBalances,keys,address,s.decimals);
  const time=Math.max(s.lastTime,blockTime); // chain timestamps may briefly regress
  let raw=BigInt(s.raw);
  const wasEligible=raw>=threshold;
  for(const key of new Set([...pre.keys(),...post.keys()])){
   const before=pre.get(key)||0n,after=post.get(key)||0n;
   if(BigInt(s.accounts[key]||'0')!==before)throw new Error('Token history gap');
   raw+=after-before;
   if(after===0n)delete s.accounts[key];else s.accounts[key]=String(after);
  }
  if(raw<0n)throw new Error('Negative reconstructed balance');
  const isEligible=raw>=threshold;
  if(wasEligible&&!isEligible){s.bestSeconds=Math.max(s.bestSeconds,Math.max(0,time-Math.max(s.start,s.currentSince)));s.currentSince=null;}
  if(!wasEligible&&isEligible)s.currentSince=time;
  s.raw=String(raw);s.lastSlot=slot;s.lastIndex=index;s.lastTime=time;
 }
 return s;
}
export function finishHistory(state,anchor){
 if(state.lastSlot>anchor.slot||state.lastTime>anchor.time||state.raw!==anchor.raw||state.decimals!==anchor.decimals)throw new Error('History does not reconcile with finalized balance');
 const keys=new Set([...Object.keys(state.accounts),...Object.keys(anchor.accounts)]);
 for(const key of keys)if(BigInt(state.accounts[key]||'0')!==BigInt(anchor.accounts[key]||'0'))throw new Error('Token accounts do not reconcile');
 const s={...state,coverageSlot:anchor.slot,throughTime:anchor.time};
 const currentSeconds=s.currentSince===null?0:Math.max(0,anchor.time-Math.max(s.start,s.currentSince));
 s.bestSeconds=Math.max(s.bestSeconds,currentSeconds);
 return {state:s,currentSeconds,bestDays:Math.floor(s.bestSeconds/DAY)};
}
export async function historyRpc(method,params){
 const url=process.env.SOLANA_HISTORY_RPC_URL?.trim();
 if(!url)throw new Error('History provider is unavailable');
 const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
 if(!response.ok)throw Object.assign(new Error('History provider is unavailable'),{rpcStatus:response.status});
 const body=await response.json();
 if(body.error||body.result===undefined){
  const message=String(body.error?.message||'');
  const category=/upgrade|paid|subscription|plan/i.test(message)?'plan_access':/api.key|unauthori|forbidden|access.denied/i.test(message)?'authentication':/not.support|not.found|not.available/i.test(message)?'method_support':/invalid.param/i.test(message)?'parameters':'rpc_error';
  throw Object.assign(new Error('History query failed'),{rpcCode:Number.isInteger(body.error?.code)?body.error.code:undefined,rpcCategory:category});
 }
 return body.result;
}
async function historyAnchor(address,minSlot){
 publicKey(address);
 const result=await historyRpc('getTokenAccountsByOwner',[address,{mint:BERI_MINT},{encoding:'jsonParsed',commitment:'finalized',minContextSlot:Math.max(0,minSlot)}]);
 const balance=parseHoldings(result,address),accounts={};
 if(!result.value.length){
  const supply=await historyRpc('getTokenSupply',[BERI_MINT,{commitment:'finalized'}]);
  if(!Number.isInteger(supply?.value?.decimals)||supply.value.decimals<0||supply.value.decimals>18)throw new Error('Mint decimals unavailable');
  balance.decimals=supply.value.decimals;
 }
 for(const item of result.value){const raw=item.account.data.parsed.info.tokenAmount.amount;if(BigInt(raw)>0n)accounts[item.pubkey]=raw;}
 const time=await historyRpc('getBlockTime',[balance.slot]);
 if(!Number.isSafeInteger(time)||time<=0||time>Date.now()/1000+10)throw new Error('Finalized timestamp unavailable');
 return {...balance,accounts,time};
}
// Two pages per request keeps the interactive refresh bounded. A token-bound
// database lease protects retries/parallel tabs; checkpoint changes are atomic.
export async function syncHoldingHistory(link,{maxPages=2}={}){
 let start;
 try{start=historyStart();}catch{return {status:'configuration_required'};}
 const token=randomUUID();
 const record=await walletDb('rpc/claim_wallet_history','POST',{p_link:link.id,p_token:token});
 if(!record)return {status:'busy'};
 try{
  let checkpoint=record.checkpoint,job=record.job;
  if(checkpoint&&checkpoint.start!==start)throw new Error('History eligibility policy changed; review required');
  if(!job){
   if(mintFirstSlot===null){
    const first=await historyRpc('getTransactionsForAddress',[BERI_MINT,{transactionDetails:'signatures',sortOrder:'asc',limit:1,commitment:'finalized',filters:{status:'succeeded'}}]);
    // Helius token-account coverage begins at this slot. Never label a partial
    // older mint history as complete, even if its ending balance happens to match.
    if(!Number.isSafeInteger(first?.data?.[0]?.slot)||first.data[0].slot<111491819)throw new Error('Mint predates supported token history');
    mintFirstSlot=first.data[0].slot;
   }
   const anchor=await historyAnchor(link.address,checkpoint?.coverageSlot??0);
   if(checkpoint&&anchor.slot<=checkpoint.coverageSlot){await walletDb('rpc/save_wallet_history','POST',{p_link:link.id,p_token:token,p_job:null,p_checkpoint:checkpoint});return {status:'complete'};}
   job={anchor,state:checkpoint||emptyHistory(start,anchor.decimals),cursor:null,minSlot:mintFirstSlot};
  }
  for(let i=0;i<maxPages;i++){
   const result=await historyRpc('getTransactionsForAddress',[link.address,{transactionDetails:'full',encoding:'json',maxSupportedTransactionVersion:1,commitment:'finalized',minContextSlot:job.anchor.slot,sortOrder:'asc',limit:1000,...(job.cursor?{paginationToken:job.cursor}:{}),filters:{status:'succeeded',tokenAccounts:'all',slot:{...(job.state.coverageSlot>=0?{gt:job.state.coverageSlot}:{gte:job.minSlot}),lte:job.anchor.slot}}}]);
   if(!Array.isArray(result.data)||!(result.paginationToken===null||typeof result.paginationToken==='string')||(result.paginationToken&&(!result.data.length||result.paginationToken===job.cursor)))throw new Error('Incomplete history page');
   job.state=replayHistory(job.state,result.data,link.address);
   job.cursor=result.paginationToken;
   if(!job.cursor){checkpoint=finishHistory(job.state,job.anchor).state;job=null;break;}
  }
  await walletDb('rpc/save_wallet_history','POST',{p_link:link.id,p_token:token,p_job:job,p_checkpoint:checkpoint});
  return {status:job?'indexing':'complete'};
 }catch{
  // Keep the last good checkpoint and cursor; a failed page never awards levels.
  await walletDb('rpc/fail_wallet_history','POST',{p_link:link.id,p_token:token});
  return {status:'retrying'};
 }
}
