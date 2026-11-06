import { getAuthClient } from './client';

/** Resolve before navigating, so returning players never see the chooser. */
export async function playerDestination(userId:string):Promise<string> {
 try {
  const {data,error}=await getAuthClient().from('players').select('allegiance').eq('user_id',userId).single();
  if(error)return '/dashboard'; // The dashboard offers a retry instead of guessing.
  return data.allegiance?'/dashboard':'/allegiance';
 } catch { return '/dashboard'; }
}
