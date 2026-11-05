'use client';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getAuthClient } from './client';
const Context = createContext<{user:User|null;loading:boolean}>({user:null,loading:true});
export function AuthProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<User|null>(null),[loading,setLoading]=useState(true);
 useEffect(()=>{
  const auth=getAuthClient().auth;
  const {data:{subscription}}=auth.onAuthStateChange((_event,session)=>{setUser(session?.user??null);setLoading(false);});
  return()=>subscription.unsubscribe();
 },[]);
 return <Context.Provider value={{user,loading}}>{children}</Context.Provider>;
}
export const useAuth=()=>useContext(Context);
