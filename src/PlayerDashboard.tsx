'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type Allegiance, type Player } from './auth/AuthProvider';
import { SiteHeader } from './components/SiteHeader';
import { CreatorPoster } from './components/CreatorPoster';
import { HomeCompass, HomeWheel } from './components/HomeIcons';
import { BeriSymbol } from './components/BeriSymbol';
import {useEnergy} from './energy/useEnergy';
import {EnergyPanel} from './energy/EnergyPanel';
import { WalletHoldingCard } from './holdings/WalletHoldingCard';
import { Link } from './router';

type Section='Dashboard'|'My Character'|'Exploration'|'Devil Fruits'|'Marketplace'|'Factions'|'Leaderboard';
const sections:Section[]=['Dashboard','My Character','Exploration','Devil Fruits','Marketplace','Factions','Leaderboard'];
const factions:Record<Allegiance,{name:string;singular:string;position:string;mission:string}>={
 pirates:{name:'Pirates',singular:'Pirate',position:'0%',mission:'Sail free, seek treasure, and make your name across the seas.'},
 marines:{name:'Marines',singular:'Marine',position:'50%',mission:'Defend the islands, uphold justice, and protect the seas.'},
 revolutionaries:{name:'Revolutionaries',singular:'Revolutionary',position:'100%',mission:'Challenge the powers of the world and unite allies for a new era.'},
};
const fine='KONO SAKUHIN WA FICTION DESUNODE JITSUZAISURU JINBUTSU DANTAI SONOTA NO SOSHIKI TO DOITSU NO MEISHOU GA GEKICHU NI TOUJYOU SHITATOSHITEMO JITSUZAI NA MONOTOWA ISSAI MUKANKEIDESU';
const number=(value:number)=>new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(value);

export function PlayerDashboard(){
 const {user,loading,player,playerLoading,playerError,refreshPlayer}=useAuth(),router=useRouter();
 useEffect(()=>{if(user&&player&&!player.allegiance)router.replace('/allegiance');},[user,player,router]);
 if(loading||playerLoading||user&&player&&!player.allegiance)return <DashboardShell><div className="dashboard-guard" role="status">Opening your captain’s quarters…</div></DashboardShell>;
 if(!user)return <DashboardShell><div className="dashboard-guard"><h1>Your adventure awaits</h1><p>Sign in to enter your player dashboard.</p><Link className="dashboard-button" href="/account">Sign Up / Log In →</Link></div></DashboardShell>;
 if(playerError||!player)return <DashboardShell><div className="dashboard-guard"><p role="alert">{playerError||'Your player record is unavailable.'}</p><button className="dashboard-button" onClick={refreshPlayer}>Retry</button></div></DashboardShell>;
 return <DashboardContent key={user.id} player={player}/>;
}
function DashboardShell({children}:{children:React.ReactNode}){
 return <div className="home-page landing-page player-dashboard"><SiteHeader active="home" primaryAction="player"/>{children}</div>;
}
function DashboardContent({player}:{player:Player}){
 const {user}=useAuth();
 const energy=useEnergy();
 const level=energy.state?.highest_level??player.level;
 const [section,setSection]=useState<Section>('Dashboard');
 const faction=factions[player.allegiance!],name=player.display_name.trim()||'Captain';
 const portrait=user?.user_metadata?.profile?.avatar||'/portraits/home-luffy.jpg';
 const choose=(next:Section)=>{setSection(next);};
 return <DashboardShell><div className="dashboard-layout">
  <aside className="dashboard-sidebar"><nav aria-label="Player dashboard sections">{sections.map(item=><button key={item} className={section===item?'is-active':''} aria-current={section===item?'page':undefined} onClick={()=>choose(item)}><DashboardIcon kind={item}/><span>{item}</span></button>)}</nav></aside>
  <main className="dashboard-main">
   <header className="dashboard-welcome"><div><p className="dashboard-eyebrow"><HomeCompass/> The captain’s quarters</p><h1>Welcome, {name}!</h1><p className="dashboard-welcome-copy">Your journey as a {faction.singular} has begun. Set sail, grow stronger, and raise your bounty!</p></div><div className="dashboard-flag" role="img" aria-label={`${faction.name} flag`} style={{backgroundPosition:`${faction.position} center`}}/></header>
   <section className="dashboard-stats" aria-label="Player statistics">
    <Stat label="Wanted Bounty" value={<><BeriSymbol/>{number(player.wanted_bounty)}</>} detail={`World Rank ${player.world_rank?`#${number(player.world_rank)}`:'—'}`}/>
    <Stat label="Energy" value={energy.balance===null?'—':`${number(Math.floor(energy.balance))} EP`} detail={energy.state?`Reserve: ${number(energy.state.capacity)} EP`:'Syncing reserve…'}/>
    <Stat label="Level" value={`Lv. ${level}`} detail="Highest unlocked level"/>
    <Stat label="Allegiance" value={faction.name} detail={<DashboardIcon kind="My Character"/>}/>
   </section>
   <EnergyPanel energy={energy}/>
   <WalletHoldingCard/>
   {section==='Dashboard'?<div className="dashboard-overview">
    <section className="dashboard-panel dashboard-identity"><h2>Your wanted identity</h2><div className="dashboard-identity-body"><CreatorPoster className="dashboard-poster" name={name} bounty={String(player.wanted_bounty)} portrait={portrait} photoClassName="" fine={fine}/><div className="dashboard-character-copy"><span className="dashboard-level-tag">{faction.singular} · Level {level}</span><h3>{name}</h3><dl><div><dt>Fighting Style:</dt><dd>{player.fighting_style||'Not Chosen'}</dd></div><div><dt>Devil Fruit:</dt><dd>{player.devil_fruit||'None'}</dd></div></dl><button className="dashboard-button" onClick={()=>choose('My Character')}>Character Details <span aria-hidden="true">→</span></button></div></div></section>
    <section className="dashboard-panel dashboard-adventure"><h2>Your next adventure</h2><img src="/scene/uncharted-seas-v1.webp" alt="Uncharted islands surrounded by blue seas"/><h3>The Uncharted Seas</h3><p>Begin your first expedition, earn rewards, and search for rare Devil Fruits.</p><button className="dashboard-button" onClick={()=>choose('Exploration')}>Explore the Waters <span aria-hidden="true">→</span></button></section>
   </div>:<section className="dashboard-panel dashboard-section" aria-label={section}>
    <div className="dashboard-section-heading"><h2><DashboardIcon kind={section}/>{section}</h2><button className="dashboard-back" onClick={()=>choose('Dashboard')}>← Dashboard</button></div>
    {section==='My Character'?<div className="dashboard-character-details"><img src={portrait} alt={`${name}'s portrait`}/><div><span className="dashboard-level-tag">{faction.singular} · Level {level}</span><h3>{name}</h3><dl><div><dt>Allegiance</dt><dd>{faction.name} · Permanent</dd></div><div><dt>Fighting style</dt><dd>{player.fighting_style||'Not chosen'}</dd></div><div><dt>Devil Fruit</dt><dd>{player.devil_fruit||'None'}</dd></div></dl><Link className="dashboard-button" href="/profile">Edit Profile →</Link></div></div>
    :section==='Exploration'?<div className="dashboard-exploration"><img src="/scene/uncharted-seas-v1.webp" alt="The Uncharted Seas"/><h3>The Uncharted Seas</h3><p>Your first destination awaits. Expeditions and rewards are not available yet.</p><p>Your current reserve is <strong>{energy.balance===null?'syncing…':`${number(Math.floor(energy.balance))} EP`}</strong>.</p></div>
    :section==='Factions'?<div className="dashboard-faction-detail"><div className="dashboard-flag" role="img" aria-label={`${faction.name} flag`} style={{backgroundPosition:`${faction.position} center`}}/><div><h3>{faction.name}</h3><p>{faction.mission}</p><strong>Your allegiance is permanent.</strong><p>You’ll return to this faction every time you sign in.</p></div></div>
    :section==='Devil Fruits'?<><h3>{player.devil_fruit||'No Devil Fruit equipped'}</h3><p>{player.devil_fruit?'Your equipped Devil Fruit is saved to your character.':'Your character has not discovered a Devil Fruit yet. Fruit discovery will become available with expeditions.'}</p></>
    :section==='Marketplace'?<><h3>The trading docks</h3><p>The marketplace is not open yet. No items or transactions are available.</p></>
    :<><h3>{player.world_rank?`Your world rank: #${number(player.world_rank)}`:'Your legend starts here'}</h3><p>Your wanted bounty is {number(player.wanted_bounty)}. Community rankings will appear when the leaderboard opens.</p></>}
   </section>}
  </main>
 </div></DashboardShell>;
}
function Stat({label,value,detail}:{label:string;value:React.ReactNode;detail?:React.ReactNode}){
 return <div className="dashboard-stat"><h2>{label}</h2><strong>{value}</strong>{detail&&<small>{detail}</small>}</div>;
}
function DashboardIcon({kind}:{kind:Section}){
 if(kind==='Factions')return <HomeWheel/>;
 return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 {kind==='Dashboard'?<><path d="m3 14 13-11 13 11M6 12v17h20V12M12 29V18h8v11"/></>
 :kind==='My Character'?<><path d="m5 3 4 1 17 21-3 3L5 7ZM27 3l-4 1L6 25l3 3L27 7ZM3 24l6 6m14 0 6-6"/></>
 :kind==='Exploration'?<><circle cx="16" cy="5" r="3"/><path d="M16 8v21M9 13h14M3 18c0 11 13 11 13 11s13 0 13-11M3 18l-2 5m2-5 5 3m21-3 2 5m-2-5-5 3"/></>
 :kind==='Devil Fruits'?<><path d="M16 10c-18-9-18 23 0 19 18 4 18-28 0-19ZM16 11c0-8 8-11 11-6-1 3-6 4-10 0"/><path d="M9 15c-4 1-4 8 1 8 4-1 3-5 0-4m11-4c4 1 4 8-1 8"/></>
 :kind==='Marketplace'?<><path d="M4 12h24v17H4ZM3 12 7 4h18l4 8M10 29V19h7v10M4 12c0 5 6 5 6 0 0 5 6 5 6 0 0 5 6 5 6 0 0 5 6 5 6 0"/></>
 :<path d="m16 2 4 10 11 1-9 7 3 11-9-6-9 6 3-11-9-7 11-1Z" fill="currentColor"/>}
 </svg>;
}
