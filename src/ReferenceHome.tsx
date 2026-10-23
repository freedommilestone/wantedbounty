import { useRef, useState, type CSSProperties } from "react";
import { Link } from "./router";
import { useWallet } from "./wallet";
import { WalletButton } from "./components/WalletButton";
import "./ReferenceHome.css";

const ART = "/reference/home-design.png";
const cards = [
  { x: 106, name: "Shanks", bounty: "320,000,000", handle: "@shanks" },
  { x: 325, name: "Lady Nami", bounty: "950,000,000", handle: "@nami_holder" },
  { x: 531, name: "Zoro", bounty: "1,200,000,000", handle: "@santoryu" },
  { x: 741, name: "Luffy", bounty: "1,800,000,000", handle: "@strawhat" },
  { x: 954, name: "Robin", bounty: "1,000,000,000", handle: "@robin" },
];
const box = (x: number, y: number, width: number, height: number): CSSProperties => ({
  left: `${x / 1215 * 100}%`, top: `${y / 1295 * 100}%`,
  width: `${width / 1215 * 100}%`, height: `${height / 1295 * 100}%`,
});

function PosterArtwork({ index }: { index: number }) {
  const card = cards[index];
  return <svg viewBox={`${card.x} 890 166 270`} aria-hidden="true" preserveAspectRatio="none">
    <image href={ART} width="1215" height="1295" />
    {index === 0 && <>
      <rect x="123" y="1042" width="129" height="23" fill="#e7c997" />
      <text x="187.5" y="1061" textAnchor="middle" fill="#28180d" fontFamily="Roboto Serif, Georgia, serif" fontWeight="800" fontSize="23" style={{ fontStretch: "55%" }}>SHANKS</text>
      <rect x="151" y="1118" width="78" height="18" fill="#e9cea3" />
      <text x="153" y="1131" fill="#312313" fontFamily="Georgia, serif" fontSize="12">@shanks</text>
    </>}
  </svg>;
}

/** Supplied illustration is the desktop art layer; controls remain native and keyboard-accessible. */
export function ReferenceHome() {
  const { address, status, openModal } = useWallet();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const showPoster = (index: number) => { setSelected(index); dialog.current?.showModal(); };
  return <main className="reference-home">
    <img className="reference-home__art" src={ART} alt="" width="1215" height="1295" fetchPriority="high" />
    <header>
      <Link className="reference-hit" style={box(106, 4, 335, 73)} href="/" aria-label="BERI Bounty home" />
      <nav aria-label="Main navigation">
        <Link className="reference-hit" style={box(498, 20, 65, 40)} href="/" aria-label="Home" aria-current="page" />
        <Link className="reference-hit" style={box(578, 20, 105, 40)} href="/create" aria-label="Create Poster" />
        <a className="reference-hit" style={box(701, 20, 75, 40)} href="#reference-explore" aria-label="Explore" />
        <a className="reference-hit" style={box(794, 20, 108, 40)} href="#reference-how" aria-label="How It Works" />
      </nav>
      <div className="reference-wallet" style={box(938, 13, 190, 50)}>
        {address ? <WalletButton /> : <button className="reference-hit" onClick={openModal} disabled={status === "connecting"} aria-label={status === "connecting" ? "Connecting wallet" : "Connect Wallet"} />}
      </div>
    </header>
    <section aria-labelledby="reference-title">
      <div className="reference-sr"><p>Your name. Your story.</p><h1 id="reference-title">Wanted Bounty</h1><p>Turn your identity into a wanted poster for the BERI community.</p></div>
      <Link className="reference-hit" style={box(92, 411, 321, 61)} href="/create" aria-label="Create your poster" />
    </section>
    <section id="reference-how" className="reference-region" style={box(0, 580, 1215, 210)} aria-label="How it works">
      <div className="reference-sr"><h2>How it works</h2><ul>
        <li>Personalize your poster. Add your name, image, bounty and make it yours.</li>
        <li>BERI holder identity. Show the world you’re part of the BERI crew.</li>
        <li>Share and explore. Discover other holders’ posters and get inspired.</li>
        <li>Build the legend. More posters. More community. Bigger bounties.</li>
      </ul></div>
    </section>
    <section id="reference-explore" className="reference-region" style={box(0, 795, 1215, 370)} aria-label="The Fleet’s Latest Bounties"><h2 className="reference-sr">The Fleet’s Latest Bounties</h2></section>
    <button className="reference-hit" style={box(998, 822, 146, 42)} onClick={() => showPoster(offset)} aria-label="View all posters" />
    <button className="reference-hit" style={box(26, 962, 52, 70)} onClick={() => setOffset((offset + cards.length - 1) % cards.length)} aria-label="Previous posters" />
    <button className="reference-hit" style={box(1138, 962, 52, 70)} onClick={() => setOffset((offset + 1) % cards.length)} aria-label="Next posters" />
    {cards.map((slot, index) => {
      const cardIndex = (index + offset) % cards.length;
      return <button key={slot.x} className="reference-card" style={box(slot.x, 890, 166, 270)} onClick={() => showPoster(cardIndex)} aria-label={`${cards[cardIndex].name}, bounty ${cards[cardIndex].bounty} BERI`}><PosterArtwork index={cardIndex} /></button>;
    })}
    <p className="reference-sr" aria-live="polite">First poster: {cards[offset].name}</p>
    <footer className="reference-sr">More than a token — a crew. $BERI.</footer>
    <dialog className="reference-gallery" ref={dialog} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button className="reference-gallery__close" onClick={() => dialog.current?.close()} aria-label="Close poster gallery">×</button>
      <h2>{cards[selected].name}</h2>
      <div className="reference-gallery__poster"><PosterArtwork index={selected} /></div>
      <div className="reference-gallery__nav">
        <button onClick={() => setSelected((selected + cards.length - 1) % cards.length)} aria-label="Previous gallery poster">← Previous</button>
        <span>{selected + 1} / {cards.length}</span>
        <button onClick={() => setSelected((selected + 1) % cards.length)} aria-label="Next gallery poster">Next →</button>
      </div>
      <Link href="/create" onClick={() => dialog.current?.close()}>Create your own poster →</Link>
    </dialog>
  </main>;
}
