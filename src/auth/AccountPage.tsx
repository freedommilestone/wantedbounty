'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { getAuthClient } from './client';
import { useAuth } from './AuthProvider';
import { useWallet } from '../wallet';
import { Link } from '../router';
type Mode='signup'|'login'|'reset'|'password';
export function AccountPage(){
 const {user,loading}=useAuth();const {disconnect}=useWallet();
 const [mode,setMode]=useState<Mode>('signup'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[name,setName]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 useEffect(()=>{
  const params=new URLSearchParams(location.search);
  if(params.get('mode')==='recovery')setMode('password');
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.get('error_description'))setError(hash.get('error_description')!);
  const {data:{subscription}}=getAuthClient().auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')setMode('password');});
  return()=>subscription.unsubscribe();
 },[]);
 const switchMode=(next:Mode)=>{setMode(next);setPassword('');setMessage('');setError('');};
 async function submit(e:FormEvent){
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   const auth=getAuthClient().auth;
   if(mode==='signup'){
    const {data,error}=await auth.signUp({email:email.trim(),password,options:{data:{name:name.trim()},emailRedirectTo:location.origin+'/account'}});
    if(error)throw error;setPassword('');
    setMessage(data.session?'Welcome aboard! Your account is ready.':'Check your email to confirm your account, then log in.');
   }else if(mode==='login'){
    const {error}=await auth.signInWithPassword({email:email.trim(),password});if(error)throw error;
    setPassword('');location.assign('/profile');
   }else if(mode==='reset'){
    const {error}=await auth.resetPasswordForEmail(email.trim(),{redirectTo:location.origin+'/account?mode=recovery'});if(error)throw error;
    setMessage('If an account exists for that email, you’ll receive a password reset link.');
   }else{
    const {error}=await auth.updateUser({password});if(error)throw error;
    setPassword('');setMode('login');setMessage('Password updated.');
   }
  }catch(e){setError(e instanceof Error?e.message:'Unable to complete this request. Please retry.');}finally{setBusy(false);}
 }
 async function signOut(){setBusy(true);setError('');try{const {error}=await getAuthClient().auth.signOut();if(error)throw error;await disconnect();setMessage('You are signed out.');setMode('login');}catch(e){setError(e instanceof Error?e.message:'Unable to sign out.');}finally{setBusy(false);}}
 return <div className="account-page"><SiteHeader active="profile"/><main className="account-panel">
 <img src="/brand/wanted-bounty-logo.png" alt="" className="account-mark"/>
 <h1>{user&&mode!=='password'?'Welcome aboard':mode==='signup'?'Join the fleet':mode==='login'?'Welcome back':mode==='reset'?'Reset your password':'Choose a new password'}</h1>
 {loading?<p role="status">Loading your account…</p>:user&&mode!=='password'?<><p>Signed in as {user.email}</p><Link className="account-primary" href="/profile">Go to My Profile →</Link><button className="account-secondary" onClick={()=>switchMode("password")}>Change Password</button><button className="account-secondary" disabled={busy} onClick={signOut}>Sign Out</button></>:<>
 <p>Create your Wanted Bounty account with your email. A wallet is only needed for crypto payments and viewing BERI holdings.</p>
 {(mode==='signup'||mode==='login')&&<div className="account-tabs"><button aria-pressed={mode==='signup'} onClick={()=>switchMode('signup')}>Sign Up</button><button aria-pressed={mode==='login'} onClick={()=>switchMode('login')}>Log In</button></div>}
 <form onSubmit={submit}>
 {mode==='signup'&&<label>Pirate name<input required maxLength={32} autoComplete="nickname" value={name} onChange={e=>setName(e.target.value)}/></label>}
 {mode!=='password'&&<label>Email address<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>}
 {mode!=='reset'&&<label>{mode==='password'?'New password':'Password'}<input required type="password" minLength={mode==='login'?1:8} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/>{mode!=='login'&&<small>Use at least 8 characters.</small>}</label>}
 <button className="account-primary" disabled={busy}>{busy?'Please wait…':mode==='signup'?'Create Account':mode==='login'?'Log In':mode==='reset'?'Send Reset Link':'Save New Password'}</button>
 </form><button className="account-secondary" onClick={()=>switchMode(mode==='reset'?'login':'reset')}>{mode==='reset'?'Back to Log In':'Forgot your password?'}</button></>}
 {message&&<p role="status">{message}</p>}{error&&<p className="account-error" role="alert">{error}</p>}
 </main></div>;
}
