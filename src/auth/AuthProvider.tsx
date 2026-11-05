'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getAuthClient } from './client';
export type Allegiance = 'pirates' | 'marines' | 'revolutionaries';
export type Player = {user_id:string;display_name:string;allegiance:Allegiance|null;allegiance_chosen_at:string|null};
const Context = createContext<{user:User|null;loading:boolean;player:Player|null;playerLoading:boolean;playerError:string;refreshPlayer:()=>void}>({user:null,loading:true,player:null,playerLoading:true,playerError:'',refreshPlayer:()=>{}});
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 const [record,setRecord]=useState<{id:string;player:Player|null;error:string}|null>(null);
 const [revision,setRevision]=useState(0);
 const refreshPlayer=useCallback(()=>{setRecord(null);setRevision(n=>n+1);},[]);
 useEffect(()=>{
  const auth=getAuthClient().auth;
  const {data:{subscription}}=auth.onAuthStateChange((_event,session)=>{setUser(session?.user??null);setLoading(false);});
  return()=>subscription.unsubscribe();
 },[]);
 useEffect(()=>{
  let active=true;
  if(!user){setRecord(null);return;}
  getAuthClient().from('players').select('user_id,display_name,allegiance,allegiance_chosen_at').eq('user_id',user.id).single()
   .then(({data,error})=>{if(active)setRecord({id:user.id,player:data,error:error?'We couldn’t load your player record. Please retry.':''});},()=>{if(active)setRecord({id:user.id,player:null,error:'We couldn’t load your player record. Please retry.'});});
  return()=>{active=false;};
 },[user,revision]);
 const current=record?.id===user?.id?record:null;
 return <Context.Provider value={{user,loading,player:current?.player??null,playerLoading:loading||Boolean(user&&!current),playerError:current?.error??'',refreshPlayer}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
