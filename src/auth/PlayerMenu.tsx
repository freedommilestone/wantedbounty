'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { getAuthClient } from './client';
import { Link } from '../router';

export function PlayerMenu(){
 const {user,player}=useAuth(),router=useRouter();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),id=useId();
 useEffect(()=>{
  if(!open)return;
  const outside=(e:PointerEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false);};
  const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.current?.focus();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[open]);
 if(!user)return <Link className="header-play-game" href="/account">Sign In</Link>;
 const name=player?.display_name?.trim()||'Captain';
 const avatar=user.user_metadata?.profile?.avatar||'/portraits/home-luffy.jpg';
 async function signOut(){
  setBusy(true);setError('');
  try{const {error}=await getAuthClient().auth.signOut();if(error)throw error;setOpen(false);router.replace('/');}
  catch{setError('Unable to sign out. Please retry.');}finally{setBusy(false);}
 }
 return <div className="player-menu" ref={root}><button className="player-menu-trigger" ref={trigger} aria-label={`Player menu for ${name}`} aria-expanded={open} aria-controls={id} onClick={()=>setOpen(!open)}><img src={avatar} alt=""/><span>{name}</span><span aria-hidden="true">⌄</span></button>
 {open&&<nav className="player-menu-panel" id={id} aria-label="Player account"><Link href="/dashboard" onClick={()=>setOpen(false)}>Dashboard</Link><Link href="/profile" onClick={()=>setOpen(false)}>My Profile</Link><Link href="/account" onClick={()=>setOpen(false)}>Account Settings</Link><button onClick={signOut} disabled={busy}>{busy?'Signing out…':'Sign Out'}</button>{error&&<p role="alert">{error}</p>}</nav>}</div>;
}
