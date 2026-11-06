import { randomUUID, randomBytes, timingSafeEqual } from 'node:crypto';
import { ed25519 } from '@noble/curves/ed25519';
import { PublicError } from './poster-store.js';
import {syncHoldingHistory} from './holding-history.js';

export const BERI_MINT=process.env.BERI_MINT?.trim()||process.env.NEXT_PUBLIC_BERI_MINT?.trim()||'GbYRS9bPStDoDCHtgc4PpuguaMAhux5s3qA2LAgxFXzt';
const alphabet='123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
export function publicKey(address){
 if(typeof address!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address))throw new PublicError('Invalid Solana wallet address.');
 let n=0n;for(const char of address)n=n*58n+BigInt(alphabet.indexOf(char));
 const bytes=[];while(n){bytes.unshift(Number(n&255n));n>>=8n;}
 for(const char of address){if(char!=='1')break;bytes.unshift(0);}
 if(bytes.length!==32)throw new PublicError('Invalid Solana wallet address.');
 return Uint8Array.from(bytes);
}
export function newChallenge(userId,address){
 publicKey(address);
 const id=randomUUID(),nonce=randomBytes(32).toString('hex'),issued=new Date().toISOString();
 return {id,message:`www.wantedbounty.xyz wants you to verify ownership of your Solana wallet:\n${address}\n\nLink this wallet to your Wanted Bounty account and track daily BERI holdings. This does not authorize transactions or transfers.\n\nURI: https://www.wantedbounty.xyz\nVersion: 1\nChain: solana:mainnet\nAccount: ${userId}\nChallenge: ${id}\nNonce: ${nonce}\nIssued At: ${issued}\nExpires: 5 minutes after issue`};
}
export function verifyWalletSignature(challenge,userId,signature,now=Date.now()){
 if(!challenge||challenge.user_id!==userId||challenge.used_at||Date.parse(challenge.expires_at)<=now)throw new PublicError('Verification expired. Request a new message.',409);
 if(typeof signature!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(signature))throw new PublicError('Invalid wallet signature.');
 try{if(ed25519.verify(Buffer.from(signature,'base64'),new TextEncoder().encode(challenge.message),publicKey(challenge.address),{zip215:false}))return; }catch{}
 throw new PublicError('The signature does not match this wallet. Reconnect and try again.',401);
}
export function validCron(req){
 const expected=process.env.CRON_SECRET;
 const provided=req.headers.authorization;
 return !!expected&&typeof provided==='string'&&Buffer.byteLength(provided)===Buffer.byteLength(`Bearer ${expected}`)&&timingSafeEqual(Buffer.from(provided),Buffer.from(`Bearer ${expected}`));
}
export async function walletDb(path,method='GET',body){
 const url=process.env.SUPABASE_URL?.replace(/\/$/,''),key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new PublicError('Wallet verification is unavailable.',503);
 const response=await fetch(`${url}/rest/v1/${path}`,{method,headers:{apikey:key,...(key.startsWith('eyJ')?{Authorization:`Bearer ${key}`} : {}),'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok){
  const message=await response.text();
  if(message.includes('WALLET_RATE_LIMIT'))throw new PublicError('Please wait a few seconds before requesting another signature.',429);
  if(message.includes('WALLET_IN_USE')||message.includes('wallet_links_address_key'))throw new PublicError('This wallet is already verified with another account.',409);
  if(message.includes('WALLET_ALREADY_LINKED'))throw new PublicError('Unlink your current verified wallet before verifying another.',409);
  if(message.includes('WALLET_CHALLENGE_EXPIRED'))throw new PublicError('Verification expired or already used. Request a new message.',409);
  throw new PublicError('Wallet records are temporarily unavailable. Please retry.',503);
 }
 const text=await response.text();return text?JSON.parse(text):null;
}
export function parseHoldings(result,address){
 if(!result||!Number.isSafeInteger(result.context?.slot)||!Array.isArray(result.value))throw new Error('Invalid RPC response');
 let raw=0n,decimals=null;const seen=new Set();
 for(const item of result.value){
  const info=item.account?.data?.parsed?.info,amount=info?.tokenAmount;
  if(!item.pubkey||seen.has(item.pubkey)||info?.mint!==BERI_MINT||info?.owner!==address||!amount||!/^\d{1,78}$/.test(amount.amount)||!Number.isInteger(amount.decimals)||amount.decimals<0||amount.decimals>18)throw new Error('Invalid token account');
  if(decimals!==null&&decimals!==amount.decimals)throw new Error('Inconsistent token decimals');
  seen.add(item.pubkey);decimals=amount.decimals;raw+=BigInt(amount.amount);
 }
 return {raw:String(raw),decimals:decimals??6,slot:result.context.slot};
}
export async function readHoldings(address){
 publicKey(address);
 const response=await fetch(process.env.SOLANA_RPC_URL||process.env.SOLANA_HISTORY_RPC_URL||'https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(12000),body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getTokenAccountsByOwner',params:[address,{mint:BERI_MINT},{encoding:'jsonParsed',commitment:'finalized'}]})});
 if(!response.ok)throw new Error('Solana unavailable');
 const body=await response.json();if(body.error)throw new Error('Solana unavailable');
 return parseHoldings(body.result,address);
}
export async function scanWallet(link){
 const claimed=await walletDb('rpc/claim_wallet_scan','POST',{p_link:link.id});
 if(!claimed)return {link,skipped:true};
 let saved;
 try{
  const balance=await readHoldings(claimed.address);
  saved=await walletDb('rpc/record_wallet_holding','POST',{p_link:link.id,p_raw:balance.raw,p_decimals:balance.decimals,p_slot:balance.slot,p_checked:new Date().toISOString()});
 }catch{
  await walletDb(`wallet_links?id=eq.${link.id}`,'PATCH',{check_failed:true});
  return {link:{...link,check_failed:true},failed:true};
 }
 if(!saved)return {link:null,skipped:true}; // unlinked while RPC was in flight
 // History failure is independent from a successful current-balance check.
 try{
  const history=await syncHoldingHistory(saved,{maxPages:1});
  const [latest]=await walletDb(`wallet_links?id=eq.${link.id}&select=*`);
  return {link:latest??null,skipped:false,history:history.status};
 }catch{return {link:saved,skipped:false,history:'retrying'};}
}
export function walletSummary(link,now=Date.now()){
 if(!link)return null;
 const today=new Date(now).toISOString().slice(0,10),yesterday=new Date(now-86400000).toISOString().slice(0,10);
 const stale=!link.last_day||link.last_day<yesterday;
 return {id:link.id,address:link.address,verifiedAt:link.verified_at,currentStreak:stale?0:link.current_streak,longestStreak:link.longest_streak,lastCheckedAt:link.last_checked_at,lastDay:link.last_day,checkFailed:link.check_failed,pending:link.last_day!==today,previousStreak:stale?link.current_streak:0,balance:link.balance_raw===null?null:(BigInt(link.balance_raw)/10n**BigInt(link.decimals)).toLocaleString('en-US'),historyStatus:link.history_status??'pending',historyCheckedAt:link.history_checked_at??null,historicalCurrentDays:link.history_current_since&&link.history_checked_at?Math.max(0,Math.floor((Date.parse(link.history_checked_at)-Date.parse(link.history_current_since))/86400000)):0,historicalBestDays:Math.floor(Number(link.history_best_seconds??0)/86400)};
}
