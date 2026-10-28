import { useEffect, useMemo, useRef, useState } from "react";
import { PirateSkullIcon } from "./components/ReferenceIcons";
import { SiteHeader } from "./components/SiteHeader";
import { ExplorePoster } from "./components/ExplorePoster";
import { CompassRose, ArrowRight } from "./components/icons";
import { Link } from "./router";
import "./ExplorePage.css";
import "./ExploreMobileReference.css";
import { CreatorPoster } from "./components/CreatorPoster";

const posters = [
  {name:"Luffy",image:"home-luffy",portraitIndex:0,amount:1800000000,rank:"Captain",style:"Classic Ink"},
  {name:"Nami",image:"home-nami",portraitIndex:1,amount:950000000,rank:"Navigator",style:"Golden Age"},
  {name:"Zoro",image:"home-zoro",portraitIndex:2,amount:1200000000,rank:"Swordsman",style:"Storm-Worn"},
  {name:"Robin",image:"home-robin",portraitIndex:3,amount:1000000000,rank:"Captain",style:"Classic Ink"},
  {name:"Shanks",image:"home-shanks",portraitIndex:4,amount:1950000000,rank:"Navigator",style:"Golden Age"},
  {name:"Ace",image:"home-luffy",portraitIndex:5,amount:1500000000,rank:"Swordsman",style:"Storm-Worn"},
  {name:"Nico Robin",image:"home-nami",portraitIndex:6,amount:1300000000,rank:"Captain",style:"Classic Ink"},
  {name:"Sanji",image:"home-zoro",portraitIndex:7,amount:1100000000,rank:"Navigator",style:"Golden Age"},
  {name:"Franky",image:"home-robin",portraitIndex:8,amount:700000000,rank:"Swordsman",style:"Storm-Worn"},
  {name:"Usopp",image:"home-shanks",portraitIndex:9,amount:600000000,rank:"Captain",style:"Classic Ink"},
  {name:"Jinbe",image:"home-luffy",portraitIndex:10,amount:800000000,rank:"Navigator",style:"Golden Age"},
  {name:"Boa Hancock",image:"home-nami",portraitIndex:11,amount:1400000000,rank:"Swordsman",style:"Storm-Worn"},
  {name:"Kid",image:"home-zoro",portraitIndex:12,amount:1050000000,rank:"Captain",style:"Classic Ink"},
  {name:"Law",image:"home-robin",portraitIndex:13,amount:1300000000,rank:"Navigator",style:"Golden Age"},
  {name:"Kaido",image:"home-shanks",portraitIndex:14,amount:2200000000,rank:"Swordsman",style:"Storm-Worn"}
];
type Poster = typeof posters[number];
function PosterArt({poster}:{poster:Poster}) {
  return <><div className="explore-desktop-poster"><ExplorePoster name={poster.name} bounty={poster.amount} portrait="/portraits/explore-crew.png" portraitIndex={poster.portraitIndex} /></div><div className="explore-mobile-poster"><CreatorPoster name={poster.name} bounty={String(poster.amount)} portrait="/portraits/explore-crew.png" portraitIndex={poster.portraitIndex} photoClassName="" fine="KONO SAKUHIN WA FICTION DESUNODE JITSUZAISURU JINBUTSU DANTAI SONOTA NO SOSHIKI TO DOITSU NO MEISHOU GA GEKICHU NI TOUJYOU SHITATOSHITEMO JITSUZAI NA MONOTOWA ISSAI MUKANKEIDESU" /></div></>;
}
export function ExplorePage() {
  const [sort,setSort]=useState("Trending");
  const [search,setSearch]=useState("");
  const [style,setStyle]=useState("");
  const [rank,setRank]=useState("");
  const [amount,setAmount]=useState("");
  const [verified,setVerified]=useState(false);
  const [offset,setOffset]=useState(0);
  const [selected,setSelected]=useState<Poster|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{document.title="Explore the Fleet | Wanted Bounty";},[]);
  const filtered=useMemo(()=>{
    if(verified || sort==="My Posters") return [];
    const list=posters.slice(5).filter(p=>p.name.toLowerCase().includes(search.toLowerCase())&&(!style||p.style===style)&&(!rank||p.rank===rank)&&(!amount||(amount==="high"?p.amount>=1000000000:p.amount<1000000000)));
    return sort==="Highest Bounty"?list.sort((a,b)=>b.amount-a.amount):sort==="Newest"?list.reverse():list;
  },[search,style,rank,amount,verified,sort]);
  const open=(p:Poster)=>{setSelected(p);dialog.current?.showModal();};
  const card=(p:Poster)=><article className="explore-card" key={p.name}><button onClick={()=>open(p)} aria-label={`View ${p.name}'s poster`}><PosterArt poster={p}/></button><div className="explore-card-meta"><span className="explore-avatar" style={{backgroundPosition:`${(p.portraitIndex%5)*25}% ${Math.floor(p.portraitIndex/5)*50}%`}} aria-hidden="true"/><div><strong>{p.name}</strong><span>Sample poster</span></div></div></article>;
  return <div className="explore-page"><SiteHeader active="explore"/><main>
    <section className="explore-hero"><p className="explore-motto">Every bounty<br/>tells a story.</p><div className="explore-banner"><CompassRose/><h1>Wanted Bounty</h1><p>Create your poster &nbsp; • &nbsp; Join the fleet &nbsp; • &nbsp; Build the legend</p></div><Link className="explore-cta" href="/create">✎ &nbsp; Create your poster <ArrowRight/></Link><aside className="explore-sign">Turn your photo into a vintage wanted poster</aside></section>
    <section className="explore-featured" aria-labelledby="featured-heading"><header><div><h2 id="featured-heading"><PirateSkullIcon/> Featured Bounties</h2><p>The strongest. The boldest. The most wanted.</p></div><a href="#all-bounties">View all posters →</a></header><div className="explore-carousel"><button className="explore-arrow" aria-label="Previous featured posters" onClick={()=>setOffset((offset+4)%5)}>‹</button><div className="explore-featured-grid">{Array.from({length:5},(_,i)=>card(posters[(offset+i)%5]))}</div><button className="explore-arrow" aria-label="Next featured posters" onClick={()=>setOffset((offset+1)%5)}>›</button></div></section>
    <section className="explore-catalog" id="all-bounties"><aside className="explore-filters"><h2>⚑ &nbsp; All Bounties</h2><nav aria-label="Poster sorting">{["Trending","Newest","Highest Bounty","My Posters"].map((s,i)=><button key={s} aria-pressed={sort===s} className={sort===s?"selected":""} onClick={()=>setSort(s)}><span>{["♨","◷","♛","♟"][i]}</span>{s}</button>)}</nav><h3>Filter by</h3><label><span className="sr-only">Art style</span><select value={style} onChange={e=>setStyle(e.target.value)}><option value="">All Styles</option>{["Classic Ink","Golden Age","Storm-Worn"].map(s=><option key={s}>{s}</option>)}</select></label><label><span className="sr-only">Rank</span><select value={rank} onChange={e=>setRank(e.target.value)}><option value="">All Ranks</option>{["Captain","Navigator","Swordsman"].map(s=><option key={s}>{s}</option>)}</select></label><label><span className="sr-only">Bounty amount</span><select value={amount} onChange={e=>setAmount(e.target.value)}><option value="">All Amounts</option><option value="high">1 billion BERI or more</option><option value="low">Under 1 billion BERI</option></select></label><p className="explore-quote">A name. A story.<br/>A bounty of your own.<br/>— The BERI fleet</p><PirateSkullIcon className="explore-skull"/></aside>
    <div className="explore-results"><div className="explore-toolbar"><label className="explore-search"><span aria-hidden="true">⌕</span><input type="search" aria-label="Search posters by name" placeholder="Search by name…" value={search} onChange={e=>setSearch(e.target.value)}/></label><label className="explore-verified"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)}/> Show Verified Only</label></div><p className="explore-demo">Example fleet · sample names and bounties, not live rankings.</p><div className="explore-grid">{filtered.map(card)}</div>{!filtered.length&&<div className="explore-empty" role="status"><h2>{sort==="My Posters"?"Your story starts here":verified?"No verified posters yet":"No matching posters"}</h2><p>{sort==="My Posters"?"Posters currently download to your device; an online personal gallery is not available yet.":verified?"These are sample posters, so none are marked verified.":"Try another name or change your filters."}</p><Link className="explore-cta" href="/create">Create your poster <ArrowRight/></Link></div>}</div></section>
    <footer className="explore-footer"><CompassRose/><p>More bounties &nbsp; • &nbsp; More dreams &nbsp; • &nbsp; One crew</p></footer>
    <dialog className="explore-dialog" ref={dialog} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}><button className="explore-close" aria-label="Close poster" onClick={()=>dialog.current?.close()}>×</button>{selected&&<><PosterArt poster={selected}/><p>Sample poster · {selected.style} · {selected.rank}</p><Link href="/create" className="explore-cta">Create your own <ArrowRight/></Link></>}</dialog>
  </main></div>;
}
