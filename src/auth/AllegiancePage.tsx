'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '../components/SiteHeader';
import { HomeCompass } from '../components/HomeIcons';
import { getAuthClient } from './client';
import { useAuth, type Allegiance } from './AuthProvider';
import { Link } from '../router';

const factions: {id:Allegiance;name:string;motto:string;description:string;trait:string}[] = [
 {id:'pirates',name:'Pirates',motto:'Freedom Beyond the Horizon',description:'Sail under your own flag, form a crew, seek lost treasures, and make your name feared across the seas.',trait:'Adventure & Treasure'},
 {id:'marines',name:'Marines',motto:'Justice Rules the Seas',description:'Defend the islands, uphold order, pursue notorious pirates, and rise through the ranks of the Marines.',trait:'Authority & Defense'},
 {id:'revolutionaries',name:'Revolutionaries',motto:'A New Dawn Shall Rise',description:'Challenge the powers of the world, liberate territories, and unite allies behind a new era.',trait:'Strategy & Influence'},
];

export function AllegiancePage() {
 const {user,loading,player,playerLoading,playerError,refreshPlayer}=useAuth();
 const router=useRouter();
 const [selected,setSelected]=useState<Allegiance>('pirates');
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const saving=useRef(false);
 useEffect(()=>{if(player?.allegiance)router.replace('/profile');},[player?.allegiance,router]);
 async function confirm(){
  if(saving.current||!user||playerLoading||playerError)return;
  saving.current=true;setBusy(true);setError('');
  try{
   const {data,error}=await getAuthClient().from('players').update({allegiance:selected}).eq('user_id',user.id).select('allegiance').single();
   if(error||data?.allegiance!==selected)throw new Error('Your allegiance could not be saved. Please try again.');
   refreshPlayer();router.replace('/profile');
  }catch(e){setError(e instanceof Error?e.message:'Your allegiance could not be saved. Please try again.');}
  finally{saving.current=false;setBusy(false);}
 }
 return <div className="home-page landing-page allegiance-page"><SiteHeader active="home" primaryAction="play"/>
  <main className="allegiance-main">
   <header className="allegiance-intro"><p><HomeCompass/> Your destiny awaits <HomeCompass/></p><h1>Choose your allegiance</h1><span>Three powers shape the world. Which banner will you follow?</span></header>
   <fieldset className="allegiance-choices" disabled={busy||Boolean(player?.allegiance)}><legend className="sailor-sr-only">Choose your allegiance</legend>
    {factions.map((f,i)=><label className={`allegiance-card ${selected===f.id?'is-selected':''}`} key={f.id}>
     <input type="radio" name="allegiance" aria-label={f.name} value={f.id} checked={selected===f.id} onChange={()=>{setSelected(f.id);setError('');}}/>
     <span className="allegiance-card-paper"/>
     <span className="allegiance-flag" style={{backgroundPosition:`${i*50}% center`}} aria-hidden="true"/>
     <h2>{f.name}</h2><strong className="allegiance-motto">{f.motto}</strong><p className="allegiance-description">{f.description}</p>
     <span className="allegiance-trait"><FactionIcon kind={f.id}/>{f.trait}</span>
    </label>)}
   </fieldset>
   <div className="allegiance-actions"><div className="allegiance-selected" role="status">Selected: {factions.find(f=>f.id===selected)?.name} <span aria-hidden="true">✓</span></div>
    <button className="allegiance-confirm" onClick={confirm} disabled={busy||loading||playerLoading||!user||!!playerError||!!player?.allegiance}>{busy?'Saving allegiance…':'Confirm Allegiance'} <span aria-hidden="true">→</span></button>
   </div>
   {(loading||playerLoading)&&<p className="allegiance-feedback" role="status">Loading your player record…</p>}
   {!loading&&!user&&<p className="allegiance-feedback">Create an account or sign in to join your chosen side. <Link href="/account">Sign Up / Log In →</Link></p>}
   {playerError&&<p className="allegiance-feedback" role="alert">{playerError} <button onClick={refreshPlayer}>Retry</button></p>}
   {error&&<p className="allegiance-feedback" role="alert">{error}</p>}
  </main>
 </div>;
}

function FactionIcon({kind}:{kind:Allegiance}){
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {kind==='pirates'?<><path d="m6 3 20 22-3 3L3 6V3Zm20 0L6 25l3 3L29 6V3ZM3 23l6 6m14 0 6-6M5 27l-3 3m25-3 3 3"/></>:kind==='marines'?<><path d="m16 2 12 5v9c0 7-12 14-12 14S4 23 4 16V7Z"/><path d="M16 7v17M10 13h12"/></>:<><path d="m9 27-2-7-3-4 2-4 3 2V6l4-1 2 3V3l4-1 2 6 4-1 3 5-1 10-4 5v3H10Z"/><path d="m9 14 4 3h9M13 5v7m8-4v4"/></>}
 </svg>;
}
