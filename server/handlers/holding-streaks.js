import { validCron,walletDb,scanWallet } from '../wallet-verification.js';
import {syncHoldingHistory} from '../holding-history.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Method not allowed.'});
 if(!validCron(req))return res.status(401).json({error:'Unauthorized.'});
 const deadline=Date.now()+240000,today=new Date().toISOString().slice(0,10);
 let cursor='',checked=0,failed=0,skipped=0;
 try{
  while(Date.now()<deadline){
   const rows=await walletDb(`wallet_links?select=*&order=id.asc&limit=30&or=(last_checked_at.is.null,last_checked_at.lt.${today}T00:00:00Z)${cursor?`&id=gt.${cursor}`:''}`);
   if(!rows.length)return res.status(failed?503:200).json({checked,failed,skipped});
   for(let i=0;i<rows.length;i+=3){
    if(Date.now()>=deadline)return res.status(503).json({checked,failed,skipped,error:'Scan time limit reached; remaining wallets require a retry.'});
    const results=await Promise.allSettled(rows.slice(i,i+3).map(async link=>{
     const result=await scanWallet(link);
     while(result.history==='indexing'&&Date.now()<deadline-30000){
      result.history=(await syncHoldingHistory(link)).status;
     }
     return result;
    }));
    for(const result of results){if(result.status==='rejected'||result.value.failed)failed++;else if(result.value.skipped)skipped++;else checked++;}
   }
   cursor=rows.at(-1).id;
  }
  return res.status(503).json({checked,failed,skipped,error:'Scan time limit reached.'});
 }catch{return res.status(503).json({checked,failed,skipped,error:'Holding scan unavailable.'});}
}
