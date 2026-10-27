import { PublicError } from './poster-store.js';
export const MINTS={USDC:'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',USDT:'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'};
export const MEMO='MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
const TOKEN='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export function verifyTransaction(tx,order) {
  const fail=()=>{throw new PublicError('This transaction does not match your poster order. Do not send another payment; keep your receipt.',409);};
  if(!tx) throw new PublicError('Payment is not finalized yet. Wait a moment and retry without paying again.',409);
  if(!tx.meta || tx.meta.err || !tx.blockTime) fail();
  const time=tx.blockTime*1000;
  if(time<Date.parse(order.created_at)-30000 || time>Date.parse(order.expires_at)+90000) fail();
  const keys=tx.transaction.message.accountKeys;
  if(!keys.some(k=>k.pubkey===order.owner && k.signer)) fail();
  const instructions=tx.transaction.message.instructions;
  if(!instructions.some(i=>i.programId===MEMO && i.parsed===`wanted:${order.id}`)) fail();
  if(order.currency==='SOL') {
    if(!instructions.some(i=>i.programId==='11111111111111111111111111111111' && i.parsed?.type==='transfer' &&
      i.parsed.info.source===order.owner && i.parsed.info.destination===order.treasury &&
      BigInt(i.parsed.info.lamports??0)===BigInt(order.amount))) fail();
  } else {
    const mint=MINTS[order.currency];
    const valid=instructions.some(i=>{
      const p=i.parsed?.info;
      if(i.programId!==TOKEN || i.parsed?.type!=='transferChecked' || !p || p.authority!==order.owner ||
         p.mint!==mint || p.tokenAmount?.decimals!==6 || p.tokenAmount.amount!==String(order.amount)) return false;
      const index=keys.findIndex(k=>k.pubkey===p.destination);
      const post=tx.meta.postTokenBalances?.find(b=>b.accountIndex===index && b.owner===order.treasury && b.mint===mint);
      const pre=tx.meta.preTokenBalances?.find(b=>b.accountIndex===index);
      return post && BigInt(post.uiTokenAmount.amount)-BigInt(pre?.uiTokenAmount.amount??0)>=BigInt(order.amount);
    });
    if(!valid) fail();
  }
}
export async function verifyPayment(signature,order) {
  if(!/^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(signature??'')) throw new PublicError('Invalid transaction receipt.');
  const response=await fetch(process.env.SOLANA_RPC_URL||'https://api.mainnet-beta.solana.com',{
    method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),
    body:JSON.stringify({jsonrpc:'2.0',id:1,method:'getTransaction',params:[signature,{encoding:'jsonParsed',commitment:'finalized',maxSupportedTransactionVersion:0}]}),
  });
  if(!response.ok) throw new PublicError('Payment verification is temporarily unavailable. Retry without paying again.',503);
  const data=await response.json();
  if(data.error) throw new PublicError('Payment verification is temporarily unavailable. Retry without paying again.',503);
  verifyTransaction(data.result,order);
}
