import { requireAccount } from '../account-auth.js';
import { PublicError } from '../poster-store.js';
import { walletDb,newChallenge,verifyWalletSignature,scanWallet,walletSummary } from '../wallet-verification.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'Method not allowed.'});
 try{
  const userId=await requireAccount(req);
  const getLink=async()=> (await walletDb(`wallet_links?user_id=eq.${userId}&select=*`))[0]??null;
  if(req.method==='GET')return res.status(200).json({wallet:walletSummary(await getLink())});
  const {action}=req.body??{};
  if(action==='challenge'){
   const {address}=req.body,challenge=newChallenge(userId,address);
   const saved=await walletDb('rpc/issue_wallet_challenge','POST',{p_user:userId,p_id:challenge.id,p_address:address,p_message:challenge.message});
   return res.status(200).json({id:saved.id,message:saved.message,expiresAt:saved.expires_at});
  }
  if(action==='verify'){
   const {id,signature}=req.body;
   if(typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))throw new PublicError('Invalid verification request.');
   const [challenge]=await walletDb(`wallet_challenges?user_id=eq.${userId}&id=eq.${id}&select=*`);
   verifyWalletSignature(challenge,userId,signature);
   const link=await walletDb('rpc/finish_wallet_verification','POST',{p_user:userId,p_challenge:id});
   const result=await scanWallet(link);
   return res.status(200).json({wallet:walletSummary(result.link),message:result.failed?'Wallet verified. The balance check is pending; retry shortly.':'Wallet verified. Holding streak tracking has started.'});
  }
  if(action==='refresh'){
   const link=await getLink();if(!link)throw new PublicError('Verify your wallet first.',409);
   const result=await scanWallet(link);
   return res.status(200).json({wallet:walletSummary(result.link),message:result.failed?'Balance check unavailable. Saved history is unchanged.':result.skipped?'Balance checks are limited to once per minute.':'Balance and holding streak updated.'});
  }
  if(action==='unlink'){
   await walletDb('rpc/unlink_player_wallet','POST',{p_user:userId});
   return res.status(200).json({wallet:null,message:'Wallet unlinked. Holding history was cleared.'});
  }
  throw new PublicError('Unknown wallet action.');
 }catch(error){res.status(error instanceof PublicError?error.status:503).json({error:error instanceof PublicError?error.message:'Wallet service unavailable. Please retry.'});}
}
