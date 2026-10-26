import { PirateSkullIcon } from "./ReferenceIcons";
import { Link } from "../router";
import { useWallet } from "../wallet";
import { ArrowRight, CompassRose } from "./icons";

export function HowDesktop() {
 const {openModal,holdings}=useWallet();
 return <div className="how-desktop">
  <section className="how-desktop-hero"><CompassRose className="how-hero-emblem"/><h1>How It Works</h1><h2>Hold BERI. Build your legend.</h2><p>Join the crew and create your own One Piece–style<br/>wanted poster. Here’s how it all works.</p></section>
  <aside className="how-desktop-motto">More than a token.<br/>A community.<br/>A legend in the making.<CompassRose/></aside>
  <div className="how-desktop-signs" aria-hidden="true">{["Hold","Create","Earn","Share","Belong"].map(s=><span key={s}>{s}</span>)}</div>
  <div className="how-desktop-grid">
   <section className="how-card how-card--1"><span className="how-number"><b>1</b></span><h2>Become a BERI holder</h2><h3>Hold $BERI in your wallet.</h3><div className="how-copy"><p>Connect a compatible Solana wallet to see your BERI balance. Your holdings can set the bounty on your wanted poster.</p><button onClick={openModal}>Connect wallet →</button></div></section>
   <section className="how-card how-card--2"><span className="how-number"><b>2</b></span><h2>Explore Zcash rewards</h2><h3>Learn about stonk.fun.</h3><div className="how-copy"><p>Visit stonk.fun for its current eligibility and distribution rules. Rewards are determined by that service and are not guaranteed by Wanted Bounty.</p><a href="https://stonk.fun" target="_blank" rel="noreferrer">Learn more →</a></div><p className="how-card-note">Hold BERI<br/>Build your<br/>crew</p></section>
   <section className="how-card how-card--3"><span className="how-number"><b>3</b></span><h2>Create your wanted poster</h2><h3>Turn yourself into a legend.</h3><div className="how-copy"><p>Upload your photo, customize your details, and choose a vintage finish. Preview your poster before paying. Finishes use filters, not AI generation.</p></div><Link className="how-create-action" href="/create">Create your poster →</Link><span className="how-poster-title" aria-hidden="true">WANTED</span><span className="how-poster-caption" aria-hidden="true">DEAD OR ALIVE<br/><b>YOUR NAME</b><br/>฿ 1,250,000 BERI</span></section>
   <section className="how-card how-card--4"><span className="how-number"><b>4</b></span><h2>One-time $5 fee</h2><h3>USDC, USDT or SOL on Solana.</h3><div className="how-copy"><p>Pay 5 USDC, 5 USDT, or $5 in SOL to unlock your poster download. SOL uses a live quote. Approve the payment in your wallet; network fees are additional.</p></div><ul><li>Review before paying</li><li>Download your poster</li><li>One-time creation fee</li></ul></section>
   <section className="how-card how-card--5"><span className="how-number"><b>5</b></span><h2>See your bounty</h2><h3>Your holdings. Your story.</h3><div className="how-copy"><p>Your BERI holdings can set your poster’s bounty. You can also enter your own amount and explore the fleet for inspiration.</p></div><div className="how-bounty-board"><header>Your bounty <Link href="/explore">Explore →</Link></header><strong>{holdings.state==="ready"?holdings.display:"1,250,000"} BERI</strong><p>{holdings.state==="ready"?"Connected wallet balance":"Example bounty · connect to see yours"}</p><button onClick={openModal}>View wallet</button></div></section>
   <section className="how-card how-card--6"><span className="how-number"><b>6</b></span><h2>Your poster, your control</h2><h3>Make it your own.</h3><div className="how-copy"><p>Edit your details before paying, then download your poster. Your photo stays in your browser. Save the finished image and share your story.</p><Link href="/create">✎ &nbsp; Customize poster</Link><Link href="/explore">◉ &nbsp; Explore the fleet</Link></div></section>
  </div>
  <footer className="how-desktop-footer"><h2>Ready to make your mark?</h2><p>Join the BERI crew and create your own legendary wanted poster.</p><Link href="/create">Create your poster <ArrowRight/></Link><div className="how-footer-sign"><PirateSkullIcon/><small>More than a token<br/>A crew<br/>$BERI</small></div></footer>
 </div>;
}
