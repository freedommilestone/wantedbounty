import { useRef, useState, type ReactNode } from "react";
import { HomePreloader } from "./components/HomePreloader";
import { ExplorePage } from "./ExplorePage";
import { HowItWorksPage } from "./HowItWorksPage";
import { CreatePosterPage } from "./CreatePosterPage";
import { SiteHeader } from "./components/SiteHeader";
import { WalletModal } from "./components/WalletModal";
import { WantedPoster } from "./components/WantedPoster";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CliffsArt,
  CompassRose,
  EditIcon,
  HelmLogo,
  SkullIcon,
} from "./components/icons";
import { HomeWheel, HomeCompass, HomeHat, HomeDiamond, HomeEmblem } from "./components/HomeIcons";
import { Link, usePath } from "./router";
import { organicEdges, tornPaper } from "./torn";
import { shortAddress, useWallet, WalletProvider, type BeriHoldings } from "./wallet";
import "./App.css";
import "./HomePage.css";
import "./HomeReferenceLayout.css";
import "./HomeMobile.css";

const FEATURES_EDGE = organicEdges(11, { top: 22, bottom: 12 });
const FLEET_EDGE = organicEdges(29, { top: 17, bottom: 20 });
const CTA_EDGE = tornPaper(5, 22, 1.4);

const features = [
  { Icon: HomeWheel, title: "Personalize\nyour poster", text: "Add your name, image, bounty and make it yours." },
  { Icon: HomeHat, title: "BERI holder\nidentity", text: "Show the world you're part of the BERI crew." },
  { Icon: HomeCompass, title: "Share & explore", text: "Discover other holders' posters and get inspired." },
  { Icon: HomeDiamond, title: "Build the legend", text: "More posters. More community. Bigger bounties." },
];

const fleet = [
  { name: "Shanks", bounty: "320,000,000", handle: "@shanks", time: "2h ago", portrait: "/portraits/home-shanks.jpg" },
  { name: "Lady Nami", bounty: "950,000,000", handle: "@nami_hodler", time: "5h ago", portrait: "/portraits/home-nami.jpg" },
  { name: "Zoro", bounty: "1,200,000,000", handle: "@santoryu", time: "7h ago", portrait: "/portraits/home-zoro.jpg" },
  { name: "Luffy", bounty: "1,800,000,000", handle: "@strawhat", time: "12h ago", portrait: "/portraits/home-luffy.jpg" },
  { name: "Robin", bounty: "1,000,000,000", handle: "@robin", time: "1d ago", portrait: "/portraits/home-robin.jpg" },
  { name: "Red Hawk", bounty: "640,000,000", handle: "@redhawk", time: "1d ago", portrait: "/portraits/red-hawk.jpg" },
];

export default function App() {
  const path = usePath();
  const route = path.replace(/\/+$/, "");
  const page = route === "/create" ? <CreatePosterPage /> : route === "/how-it-works" ? <HowItWorksPage /> : route === "/explore" ? <ExplorePage /> : <HomePage />;

  return (
    <WalletProvider>
      {page}
      <WalletModal />
    </WalletProvider>
  );
}

const PLACEHOLDER_BOUNTY = "1,500,000,000";

function heroBounty(isHolder: boolean, holdings: BeriHoldings) {
  return isHolder && holdings.state === "ready" ? holdings.display : PLACEHOLDER_BOUNTY;
}

function HoldingsStatus() {
  const { address, holdings, refreshHoldings } = useWallet();
  if (!address) return null;

  let message: ReactNode;
  let tone = "info";
  switch (holdings.state) {
    case "loading":
      message = "Scanning your wallet for $BERI…";
      break;
    case "ready":
      if (holdings.amount > 0) {
        message = (
          <>
            Bounty set by your <strong>฿ {holdings.display} $BERI</strong>.
          </>
        );
        tone = "ok";
      } else {
        message = "No $BERI found in this wallet. Only $BERI holders can claim a wanted poster.";
        tone = "warn";
      }
      break;
    case "unconfigured":
      message = "The $BERI token mint isn't configured yet, so balances can't be read.";
      tone = "warn";
      break;
    case "error":
      message = (
        <>
          Couldn’t read your $BERI balance. {holdings.message}{" "}
          <button type="button" onClick={refreshHoldings}>
            Try again
          </button>
        </>
      );
      tone = "warn";
      break;
    default:
      return null;
  }

  return (
    <p className={`hero__status hero__status--${tone}`} role="status">
      {message}
    </p>
  );
}

function HomePage() {
  const { address, holdings, isHolder } = useWallet();
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(0);
  const galleryRef = useRef<HTMLDialogElement>(null);
  const openPoster = (index: number) => { setSelected(index); galleryRef.current?.showModal(); };

  return (
    <div className={`home-page ${showAll ? "home-page--expanded" : ""}`}>
      <HomePreloader />
      <SiteHeader active="home" />

      <main>
        <section className="hero" id="top">
          <div className="container hero__inner">
            <div className="hero__copy">
              <p className="hero__eyebrow">Your name. Your story.</p>
              <h1 className="hero__title" aria-label="Wanted Bounty">
                <span>Wanted</span>
                <span>
                  B<HomeEmblem className="hero__target" />
                  unty
                </span>
              </h1>
              <p className="hero__lede">
                Turn your identity into a wanted poster <br />
                for the BERI community.
              </p>
              <div className="cta-shadow">
                <Link className="cta" href="/create" style={{ clipPath: CTA_EDGE }}>
                  <EditIcon />
                  {isHolder ? "Edit your poster" : "Create your poster"}
                  <ArrowRight />
                </Link>
              </div>
              <HoldingsStatus />
              <div className="hero__beri">
                <strong>$BERI</strong>
                <span>The currency of dreams, freedom &amp; legends.</span>
              </div>
            </div>

            <WantedPoster
              className="hero__poster"
              name={isHolder && address ? shortAddress(address) : "Your Name"}
              nameIsAddress={isHolder}
              bounty={heroBounty(isHolder, holdings)}
              portrait="/portraits/home-luffy.jpg"
              seed={7}
            />
            <div className="home-motto" aria-hidden="true"><span>Every legend<br />has a price.</span><CompassRose /></div>
          </div>
        </section>

        <div className="paper-shadow paper-shadow--features">
          <section className="parchment features" id="how-it-works" style={{ clipPath: FEATURES_EDGE }}>
            <div className="container features__grid">
              {features.map(({ Icon, title, text }) => (
                <article className="feature" key={title}>
                  <Icon className="feature__icon" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="paper-shadow paper-shadow--fleet">
          <section className="parchment fleet" id="explore" style={{ clipPath: FLEET_EDGE }}>
            <div className="container">
              <div className="fleet__head">
                <div className="fleet__heading">
                  <h2 className="fleet__title"><CompassRose className="fleet__heading-star" />The Fleet’s Latest Bounties</h2>
                  <div className="fleet__divider">
                    <SkullIcon className="fleet__ornament" />
                  </div>
                </div>
                <button className="fleet__all" type="button" onClick={() => setShowAll(!showAll)} aria-expanded={showAll}>
                  {showAll ? "Show carousel" : "View All Posters"} <ArrowRight />
                </button>
              </div>
              <FleetCarousel showAll={showAll} onSelect={openPoster} />
              <MobileFleet showAll={showAll} onSelect={openPoster} />
            </div>
          </section>
        </div>
      </main>

      <dialog className="home-gallery" ref={galleryRef} onClick={event => { if (event.target === event.currentTarget) galleryRef.current?.close(); }}>
        <button className="home-gallery__close" type="button" onClick={() => galleryRef.current?.close()} aria-label="Close poster">×</button>
        <WantedPoster name={fleet[selected].name} bounty={fleet[selected].bounty} portrait={fleet[selected].portrait} />
        <div className="home-gallery__nav">
          <button type="button" onClick={() => setSelected((selected + fleet.length - 1) % fleet.length)} aria-label="Previous gallery poster">← Previous</button>
          <span>{selected + 1} / {fleet.length}</span>
          <button type="button" onClick={() => setSelected((selected + 1) % fleet.length)} aria-label="Next gallery poster">Next →</button>
        </div>
        <Link href="/create" onClick={() => galleryRef.current?.close()}>Create your own poster →</Link>
      </dialog>

      <footer className="site-footer">
        <CompassRose className="site-footer__compass" />
        <CliffsArt className="site-footer__cliffs" />
        <HelmLogo className="site-footer__logo" />
        <p className="site-footer__motto">More than a token — a crew</p>
        <p className="site-footer__ticker">$BERI</p>
        <div className="mobile-footer-sign"><span>More than<br />a token</span><span>— A crew</span><span>$BERI</span></div>
      </footer>
    </div>
  );
}

function FleetCarousel({ showAll, onSelect }: { showAll: boolean; onSelect: (index: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className={`carousel ${showAll ? "carousel--all" : ""}`}>
      <button className="carousel__arrow carousel__arrow--prev" type="button" aria-label="Previous posters" onClick={() => scroll(-1)}>
        <ChevronLeft />
      </button>
      <div className="carousel__track" ref={trackRef}>
        {fleet.map((item, index) => (
          <article className="bounty-card" key={item.handle}>
            <button className="bounty-card__open" type="button" onClick={() => onSelect(index)} aria-label={`View ${item.name} poster`}>
              <WantedPoster name={item.name} bounty={item.bounty} portrait={item.portrait} seed={13 + index * 7} />
            </button>
            <div className="bounty-card__meta">
              <img src={item.portrait} alt="" />
              <div>
                <strong>{item.handle}</strong>
                <span>{item.time}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
      <button className="carousel__arrow carousel__arrow--next" type="button" aria-label="Next posters" onClick={() => scroll(1)}>
        <ChevronRight />
      </button>
    </div>
  );
}

function MobileFleet({ showAll, onSelect }: { showAll: boolean; onSelect: (index: number) => void }) {
  const [page, setPage] = useState(0);
  const start = useRef<number | null>(null);
  const order = [2, 3, 1, 0, 4, 5];
  const move = (delta: number) => setPage(value => (value + delta + 5) % 5);
  const visible = showAll ? order : [0, 1, 2].map(offset => order[(page + offset) % order.length]);
  return <div className={`mobile-fleet ${showAll ? "mobile-fleet--all" : ""}`}>
    <div className="mobile-fleet__cards" onTouchStart={event => { start.current = event.touches[0].clientX; }} onTouchEnd={event => { if (start.current !== null && !showAll) { const delta = event.changedTouches[0].clientX - start.current; if (Math.abs(delta) > 35) move(delta < 0 ? 1 : -1); } start.current = null; }}>
      {visible.map((index) => <article className="bounty-card" key={fleet[index].handle}>
        <button className="bounty-card__open" onClick={() => onSelect(index)} aria-label={`View ${fleet[index].name} poster`}>
          <WantedPoster name={index === 1 ? "Nami" : fleet[index].name} bounty={fleet[index].bounty} portrait={fleet[index].portrait} seed={13 + index * 7} />
        </button>
        <div className="bounty-card__meta"><img src={fleet[index].portrait} alt="" /><div><strong>{fleet[index].handle}</strong><span>{fleet[index].time}</span></div></div>
      </article>)}
    </div>
    {!showAll && <><button className="mobile-fleet__prev" onClick={() => move(-1)} aria-label="Previous mobile posters"><ChevronLeft /></button><button className="mobile-fleet__next" onClick={() => move(1)} aria-label="Next mobile posters"><ChevronRight /></button>
    <div className="mobile-fleet__dots" aria-label="Poster carousel pages">{Array.from({length:5},(_,index)=><button key={index} aria-label={`Poster page ${index + 1}`} aria-current={page === index ? "true" : undefined} onClick={() => setPage(index)} />)}</div></>}
  </div>;
}
