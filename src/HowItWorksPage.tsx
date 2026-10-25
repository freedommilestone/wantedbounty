import { useEffect } from "react";
import { SiteHeader } from "./components/SiteHeader";
import { CreatorPoster } from "./components/CreatorPoster";
import { CompassRose, ArrowRight } from "./components/icons";
import { Link } from "./router";
import { useWallet } from "./wallet";
import "./HowItWorksPage.css";

function Action({children,href="/create"}:{children:React.ReactNode;href?:string}) {
  return <Link className="legend-action" href={href}>{children}<ArrowRight /></Link>;
}
export function HowItWorksPage() {
  const {openModal,holdings}=useWallet();
  useEffect(()=>{document.title="How It Works | Wanted Bounty";},[]);
  return <div className="legend-page">
    <SiteHeader active="how" />
    <main>
      <section className="legend-hero">
        <p className="legend-motto">More than a token.<br/>A community.<br/>A legend in the making.</p>
        <div className="legend-title-paper"><h1>How It Works</h1><h2>Hold BERI. Build your legend.</h2><p>Join the crew and create your own<br/>One Piece–style wanted poster. Here’s how it all works.</p></div>
        <div className="legend-compass"><CompassRose/><p>Every legend<br/>has a price.</p></div>
        <h2 className="legend-journey">The journey to legendary status</h2>
      </section>
      <section className="legend-row">
        <div className="legend-copy"><span className="legend-number">1</span><h2>Become a BERI holder</h2><h3>Hold $BERI in your wallet.</h3><p>Connect a compatible Solana wallet to see your BERI balance. Your holdings can become the bounty on your poster. You can also choose your own bounty.</p><button className="legend-action" onClick={openModal}>Connect wallet <ArrowRight/></button></div>
        <img className="legend-treasure" src="/scene/legend-treasure.png" alt="Pirate chest overflowing with BERI coins beneath a black flag"/>
      </section>
      <section className="legend-row legend-row--reverse">
        <div className="legend-reward-art" aria-hidden="true"><img src="/scene/legend-treasure.png" alt=""/><span className="legend-coin legend-coin--zcash">Ƶ</span></div>
        <div className="legend-copy"><span className="legend-number">2</span><h2>Explore Zcash rewards</h2><h3>Learn about stonk.fun.</h3><p>Check stonk.fun for its current eligibility and distribution rules. Rewards are determined by that service and are not guaranteed by Wanted Bounty.</p><a className="legend-action" href="https://stonk.fun" target="_blank" rel="noreferrer">Learn more <ArrowRight/></a></div>
      </section>
      <section className="legend-row">
        <div className="legend-copy"><span className="legend-number">3</span><h2>Create your wanted poster</h2><h3>Turn yourself into a legend.</h3><p>Upload your photo, choose your pirate name, title and bounty, then pick a vintage finish. Watch your poster take shape in the live preview. Photo finishes use filters, not AI generation.</p><Action>Create your poster</Action></div>
        <div className="legend-poster-fan" aria-label="Example wanted posters">{["Nami","Luffy","Zoro"].map((name)=><CreatorPoster key={name} name={name} bounty="1,250,000" portrait={`/portraits/home-${name.toLowerCase()}.jpg`} photoClassName="" fine="By order of the BERI fleet"/>)}</div>
      </section>
      <section className="legend-row">
        <div className="legend-copy"><span className="legend-number">4</span><h2>One-time $5 fee</h2><h3>Pay with USDC, USDT or SOL.</h3><p>Pay 5 USDC, 5 USDT, or $5 in SOL on Solana to unlock your poster download. SOL uses a live quote. Review and approve the payment in your wallet; network fees are additional.</p><Action>Pay &amp; create</Action></div>
        <div className="legend-payment-art" aria-label="USDC, USDT and SOL payment options"><span className="legend-coin legend-coin--usdc">$</span><span className="legend-coin legend-coin--usdt">₮</span><span className="legend-sol">SOL</span></div>
      </section>
      <div className="legend-bottom">
        <section className="legend-ranking"><div className="legend-copy"><span className="legend-number">5</span><h2>See your bounty</h2><h3>Your holdings. Your story.</h3><p>Your connected wallet’s BERI balance can set your poster bounty. Explore the fleet’s example posters for inspiration.</p><Action href="/explore">Explore the fleet</Action></div><div className="legend-board"><h3>Your bounty</h3><img src="/portraits/home-luffy.jpg" alt="Example pirate portrait"/><strong>{holdings.state==="ready"?holdings.display:"1,250,000"} BERI</strong><small>{holdings.state==="ready"?"Connected wallet balance":"Example bounty · connect to see yours"}</small><div>♛ &nbsp; Build your legend</div></div></section>
        <section className="legend-control"><span className="legend-number">6</span><h2>Your poster, your control</h2><h3>Make it your own.</h3><p>Edit your details before paying, then download your finished poster. Your uploaded photo stays in your browser.</p><Action>Customize poster</Action><img src="/portraits/home-luffy.jpg" alt="" /></section>
      </div>
      <footer className="legend-footer"><h2>Ready to make your mark?</h2><p>Join the BERI crew and create your own legendary wanted poster.</p><Action>Create your poster</Action><div className="legend-footer-sign">More than a token<br/>A crew<br/>$BERI</div></footer>
    </main>
  </div>;
}
