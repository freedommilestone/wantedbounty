import {requireAccount} from '../account-auth.js';
import {PublicError} from '../poster-store.js';
import {walletDb} from '../wallet-verification.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
 try{
  const userId=await requireAccount(req);
  // The browser can sync its own reserve, never choose an amount or character ID.
  const state=await walletDb('rpc/settle_player_energy','POST',{p_user:userId});
  return res.status(200).json({state,serverTime:new Date().toISOString()});
 }catch(error){return res.status(error instanceof PublicError?error.status:503).json({error:error instanceof PublicError&&error.status===401?error.message:'Energy could not be synced. Please retry.'});}
}
