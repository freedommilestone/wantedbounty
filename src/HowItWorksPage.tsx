"use client";
import { useEffect, type ReactNode } from 'react';
import { SiteHeader } from './components/SiteHeader';
import { CreatorPoster } from './components/CreatorPoster';
import { PirateSkullIcon } from './components/ReferenceIcons';
import { ProfileIcon } from './components/ProfileIcon';
import { ArrowRight, BeriTarget, CheckIcon, EditIcon, EyeIcon, CompassRose } from './components/icons';
import { Link } from './router';
import { useWallet } from './wallet';

function Action({children,href='/create',onClick}:{children:ReactNode;href?:string;onClick?:()=>void}) {
 const content=<>{children}<ArrowRight/></>;
 return onClick?<button className="journey-action" onClick={onClick}>{content}</button>:<Link className="journey-action" href={href}>{content}</Link>;
}
function Step({number,title,subtitle,children}:{number:number;title:string;subtitle:string;children:ReactNode}) {
 return <section className={`journey-card journey-card--${number}`} aria-labelledby={`journey-step-${number}`}>
  <header className="journey-card-heading"><span className="journey-number" aria-hidden="true">{number}</span><div><h2 id={`journey-step-${number}`}>{title}</h2><h3>{subtitle}</h3></div></header>
  {children}
 </section>;
}
function Illustration({kind}:{kind:'beri'|'rewards'|'payment'|'control'}) {
 return <div className={`journey-art journey-art--${kind}`} aria-hidden="true"/>;
}
const previewRanks=[['Luffy','2,800,000',0],['Nami','1,950,000',1],['Zoro','1,320,000',2],['Sanji','980,000',7],['Robin','760,000',3]] as const;
export function HowItWorksPage() {
 const {openModal}=useWallet();
 useEffect(()=>{document.title='How It Works | Wanted Bounty';},[]);
 return <div className="legend-page journey-page">
  <SiteHeader active="how"/>
  <main className="journey-main">
   <section className="journey-hero" aria-labelledby="journey-title">
    <div className="journey-title-paper"><BeriTarget className="journey-emblem"/><h1 id="journey-title">How It Works</h1><h2>Hold BERI. Build your legend.</h2><p>Join the crew and create your own One Piece–style wanted poster. Here’s how it all works.</p></div>
    <p className="journey-motto">More than a token.<br/>A community.<br/>A legend in the making.</p>
   </section>
   <div className="journey-grid">
    <Step number={1} title="Become a BERI holder" subtitle="Hold $BERI in your wallet.">
     <div className="journey-copy"><p>Connect a compatible Solana wallet to view your BERI balance. Your holdings can set the bounty on your wanted poster.</p><Action onClick={openModal}>Connect wallet</Action></div><Illustration kind="beri"/>
    </Step>
    <Step number={2} title="Explore Zcash rewards" subtitle="Learn about stonk.fun.">
     <div className="journey-copy"><p>As a BERI holder, you may be eligible for Zcash rewards through stonk.fun. Check its current rules; rewards are determined by that service and are not guaranteed.</p><a className="journey-action" href="https://stonk.fun" target="_blank" rel="noreferrer">Learn more<ArrowRight/></a></div><Illustration kind="rewards"/>
    </Step>
    <Step number={3} title="Create your wanted poster" subtitle="Turn yourself into a legend.">
     <div className="journey-copy"><p>Upload your photo and customize your details. Our AI transforms your image into a pirate-anime portrait for your own wanted poster.</p><Action>Create your poster</Action></div>
     <div className="journey-poster-fan" aria-label="Example wanted posters">{['Nami','Your Name','Zoro'].map((name,i)=><CreatorPoster key={name} name={name} bounty="1,250,000" portrait={`/portraits/home-${['nami','luffy','zoro'][i]}.jpg`} photoClassName="" fine="KONO SAKUHIN WA FICTION DESUNODE JITSUZAISURU JINBUTSU DANTAI SONOTA NO SOSHIKI TO DOITSU NO MEISHOU GA GEKICHU NI TOUJYOU SHITATOSHITEMO JITSUZAI NA MONOTOWA ISSAI MUKANKEIDESU"/>)}</div>
    </Step>
    <Step number={4} title="One-time $5 fee" subtitle="Pay with USDC, USDT or SOL.">
     <p className="journey-wide-copy">A one-time $5 payment creates your AI wanted poster. Pay with USDC, USDT, or a live SOL quote. Approve payment in your wallet; network fees are additional.</p>
     <div className="journey-payment-bottom"><Illustration kind="payment"/><ul className="journey-checklist"><li><CheckIcon/>AI image generation</li><li><CheckIcon/>Download your poster</li><li><CheckIcon/>One-time creation fee</li></ul></div>
    </Step>
    <Step number={5} title="See your ranking" subtitle="Track your bounty.">
     <p className="journey-wide-copy">Your connected wallet supplies your default bounty. Explore the fleet and build your legend. Community rankings below are a preview.</p>
     <div className="journey-ranking"><header><ProfileIcon kind="wheel"/><h3>Top BERI holders</h3><Link href="/profile">View all <ArrowRight/></Link></header><ol>{previewRanks.map(([name,amount,index],i)=><li key={name}><span className={`journey-rank journey-rank--${i}`}>{i===0?<ProfileIcon kind="crown"/>:i+1}</span><span className="journey-rank-avatar" role="img" aria-label={name} style={{backgroundPosition:`${(index%5)*25}% ${Math.floor(index/5)*50}%`}}/><strong>{amount} BERI</strong></li>)}</ol><small>Illustrative leaderboard · live rankings coming soon</small></div>
    </Step>
    <Step number={6} title="Your poster, your control" subtitle="Your story. Your choice.">
     <p className="journey-wide-copy">Make your name and wanted condition your own. Download your finished poster, share it with the crew, and visit your profile to manage your details.</p>
     <div className="journey-controls"><Action><EditIcon/>Edit poster</Action><Action href="/profile"><EyeIcon/>My profile</Action><Action href="/explore"><CompassRose/>Explore the fleet</Action></div><Illustration kind="control"/>
    </Step>
   </div>
   <footer className="journey-footer"><div className="journey-footer-paper"><h2>Ready to make your mark?</h2><p>Join the BERI crew and create your own legendary wanted poster.</p><Action>Create your poster</Action><div className="journey-sign"><span/><PirateSkullIcon/><span/></div><small>More than a token<br/><b>A crew</b><br/>$BERI</small></div></footer>
  </main>
 </div>;
}
