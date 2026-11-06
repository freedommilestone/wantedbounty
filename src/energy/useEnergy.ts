'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {useAuth} from '../auth/AuthProvider';
import {getAuthClient} from '../auth/client';
import {useVerifiedWallet} from '../holdings/HoldingsProvider';
import {projectedEnergy,type EnergyState} from './model';
export function useEnergy(){
 const {user}=useAuth(),{wallet}=useVerifiedWallet();
 const [saved,setSaved]=useState<{userId:string;state:EnergyState}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[now,setNow]=useState(Date.now());
 const activeUser=useRef(user?.id);activeUser.current=user?.id;
 const clock=useRef({server:Date.now(),local:performance.now()});
 const busy=useRef<string|null>(null);
 const accept=useCallback((state:EnergyState,id:string)=>{
  if(activeUser.current!==id||state.user_id!==id)return;
  setSaved(old=>old?.userId===id&&old.state.revision>state.revision?old:{userId:id,state});
 },[]);
 const sync=useCallback(async()=>{
  const id=activeUser.current;if(!id||busy.current===id)return;
  busy.current=id;setLoading(true);
  try{
   const {data:{session}}=await getAuthClient().auth.getSession();if(!session)return;
   const response=await fetch('/api/energy',{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store'});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Energy could not be synced.');
   if(activeUser.current===id){clock.current={server:Date.parse(data.serverTime),local:performance.now()};setNow(clock.current.server);accept(data.state,id);setError('');}
  }catch(e){if(activeUser.current===id)setError(e instanceof Error?e.message:'Energy could not be synced.');}
  finally{if(busy.current===id)busy.current=null;if(activeUser.current===id)setLoading(false);}
 },[accept]);
 useEffect(()=>{
  const id=user?.id;setSaved(null);setError('');if(!id)return;
  void sync();
  const client=getAuthClient();
  const channel=client.channel(`energy:${id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'player_energy',filter:`user_id=eq.${id}`},payload=>accept(payload.new as EnergyState,id)).subscribe(status=>{if(status==='SUBSCRIBED')void sync();});
  const tick=window.setInterval(()=>setNow(clock.current.server+performance.now()-clock.current.local),1000);
  const poll=window.setInterval(()=>{if(document.visibilityState==='visible')void sync();},60_000);
  const resume=()=>{if(document.visibilityState==='visible')void sync();};
  document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  return()=>{void client.removeChannel(channel);clearInterval(tick);clearInterval(poll);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);};
 },[user?.id,accept,sync]);
 useEffect(()=>{if(wallet?.lastCheckedAt)void sync();},[wallet?.lastCheckedAt,sync]);
 const state=saved&&saved.userId===user?.id?saved.state:null;
 return {state,balance:state?projectedEnergy(state,now):null,now,error,loading,sync};
}
