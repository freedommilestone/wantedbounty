'use client';
import {createContext,useCallback,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {useAuth} from '../auth/AuthProvider';
import {getAuthClient} from '../auth/client';
import {useWallet} from '../wallet';
export type VerifiedWallet={id:string;address:string;verifiedAt:string;currentStreak:number;longestStreak:number;lastCheckedAt:string|null;lastDay:string|null;checkFailed:boolean;pending:boolean;previousStreak:number;balance:string|null;historyStatus:'pending'|'indexing'|'complete'|'retrying';historyCheckedAt:string|null;historicalCurrentDays:number;historicalBestDays:number};
type State={wallet:VerifiedWallet|null;loading:boolean;busy:boolean;error:string;notice:string;verify:()=>Promise<void>;refresh:()=>Promise<void>;unlink:()=>Promise<void>;reload:()=>Promise<void>};
const Context=createContext<State|null>(null);
export function HoldingsProvider({children}:{children:ReactNode}){
 const {user}=useAuth(),{address,signVerificationMessage}=useWallet();
 const [record,setRecord]=useState<{userId:string;wallet:VerifiedWallet|null}|null>(null),[loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const account=useRef(user?.id);account.current=user?.id;
 const inFlight=useRef(false);
 const api=useCallback(async(body?:Record<string,unknown>)=>{
  const {data:{session}}=await getAuthClient().auth.getSession();
  if(!session)throw new Error('Sign in to verify your wallet.');
  const response=await fetch('/api/wallet-verification',{method:body?'POST':'GET',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Wallet service unavailable.');return data;
 },[]);
 const reload=useCallback(async()=>{
  const id=account.current;if(!id)return;
  setLoading(true);
  try{const data=await api();if(account.current===id){setRecord({userId:id,wallet:data.wallet});setError('');}}
  catch(e){if(account.current===id)setError(e instanceof Error?e.message:'Unable to load wallet verification.');}
  finally{if(account.current===id)setLoading(false);}
 },[api]);
 useEffect(()=>{setRecord(null);setError('');setNotice('');setBusy(false);setLoading(false);void reload();},[user?.id,reload]);
 // Balance reads use the server-side verified address, never an extension connection.
 const linkedWalletId=record?.userId===user?.id?record?.wallet?.id:undefined;
 useEffect(()=>{
  const id=user?.id;if(!id||!linkedWalletId)return;
  let cancelled=false,lastAttempt=0;
  const check=async()=>{
   if(cancelled||document.visibilityState==='hidden'||inFlight.current||Date.now()-lastAttempt<60_000)return;
   lastAttempt=Date.now();inFlight.current=true;setBusy(true);
   try{
    const data=await api({action:'refresh'});
    if(!cancelled&&account.current===id){setRecord({userId:id,wallet:data.wallet});setError('');}
   }catch(e){
    if(!cancelled&&account.current===id)setError(e instanceof Error?e.message:'Automatic balance check unavailable. Your last checked balance is still shown.');
   }finally{inFlight.current=false;if(account.current===id)setBusy(false);}
  };
  void check();
  const timer=window.setInterval(()=>void check(),60_000);
  const resume=()=>void check();
  document.addEventListener('visibilitychange',resume);
  window.addEventListener('online',resume);
  return ()=>{cancelled=true;window.clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);};
 },[user?.id,linkedWalletId,api]);
 async function action(kind:'verify'|'refresh'|'unlink'){
  const id=account.current;if(!id||inFlight.current)return;
  inFlight.current=true;setBusy(true);setError('');setNotice('');
  try{
   let data;
   if(kind==='verify'){
    if(!address)throw new Error('Connect your wallet first.');
    const challenge=await api({action:'challenge',address});
    if(account.current!==id)return;
    const signature=await signVerificationMessage(challenge.message,address);
    if(account.current!==id)return;
    data=await api({action:'verify',id:challenge.id,signature});
   }else data=await api({action:kind});
   if(account.current===id){setRecord({userId:id,wallet:data.wallet});setNotice(data.message||'');}
  }catch(e){if(account.current===id)setError(e instanceof Error?e.message:'Wallet request cancelled or unavailable.');}
  finally{inFlight.current=false;if(account.current===id)setBusy(false);}
 }
 return <Context.Provider value={{wallet:record?.userId===user?.id?record?.wallet??null:null,loading,busy,error,notice,verify:()=>action('verify'),refresh:()=>action('refresh'),unlink:()=>action('unlink'),reload}}>{children}</Context.Provider>;
}
export function useVerifiedWallet(){const value=useContext(Context);if(!value)throw new Error('Missing HoldingsProvider');return value;}
