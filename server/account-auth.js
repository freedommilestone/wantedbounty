import { PublicError } from './poster-store.js';
export async function requireAccount(req) {
 const authorization=req.headers.authorization;
 if(typeof authorization!=='string'||!/^Bearer \S+$/.test(authorization))throw new PublicError('Please sign up or log in to your account.',401);
 const url=process.env.SUPABASE_URL?.replace(/\/$/,'');
 const key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new PublicError('Account service is unavailable.',503);
 const response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:authorization},signal:AbortSignal.timeout(10000)});
 if(response.status>=500)throw new PublicError('Account service is temporarily unavailable. Please retry.',503);
 if(!response.ok)throw new PublicError('Your session has expired. Please log in again.',401);
 const user=await response.json();
 if(!user.id||!user.email_confirmed_at)throw new PublicError('Confirm your email before continuing.',401);
 return user.id;
}
export async function authorizeOrder(req,order){
 // Legacy paid orders retain their existing recovery token access.
 if(!order.details?.accountId)return;
 if(await requireAccount(req)!==order.details.accountId)throw new PublicError('This order belongs to another account.',403);
}
