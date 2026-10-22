import { useRef, type ReactNode } from "react";
import { WalletButton } from "./components/WalletButton";
import { WalletModal } from "./components/WalletModal";
import { WantedPoster } from "./components/WantedPoster";
import {
  ArrowRight,
  BeriTarget,
  ChevronLeft,
  ChevronRight,
  CliffsArt,
  CompassIcon,
  CompassRose,
  DiamondIcon,
  EditIcon,
  HelmLogo,
  ShipWheel,
  SkullIcon,
  StrawHatIcon,
} from "./components/icons";
import { tornEdges, tornPaper } from "./torn";
import { shortAddress, useWallet, WalletProvider, type BeriHoldings } from "./wallet";
import "./App.css";

const FEATURES_EDGE = tornEdges(11, { top: 16, bottom: 12 });
const FLEET_EDGE = tornEdges(29, { top: 14, bottom: 18 });
const CTA_EDGE = tornPaper(5, 22, 1.4);

const features = [
  { Icon: ShipWheel, title: "Personalize\nyour poster", text: "Add your name, image, bounty and make it yours." },
  { Icon: StrawHatIcon, title: "BERI holder\nidentity", text: "Show the world you're part of the BERI crew." },
  { Icon: CompassIcon, title: "Share & explore", text: "Discover other holders' posters and get inspired." },
  { Icon: DiamondIcon, title: "Build the legend", text: "More posters. More community. Bigger bounties." },
];

const fleet = [
  { name: "Shanks", bounty: "320,000,000", handle: "@shanks", time: "2h ago", portrait: "/portraits/black-tide.jpg" },
  { name: "Lady Nami", bounty: "950,000,000", handle: "@nami_hodler", time: "5h ago", portrait: "/portraits/navigator.jpg" },
  { name: "Zoro", bounty: "1,200,000,000", handle: "@santoryu", time: "7h ago", portrait: "/portraits/swordsman.jpg" },
  { name: "Luffy", bounty: "1,800,000,000", handle: "@strawhat", time: "12h ago", portrait: "/portraits/hero.jpg" },
  { name: "Robin", bounty: "1,000,000,000", handle: "@robin", time: "1d ago", portrait: "/portraits/ocean-rose.jpg" },
  { name: "Red Hawk", bounty: "640,000,000", handle: "@redhawk", time: "1d ago", portrait: "/portraits/red-hawk.jpg" },
];

export default function App() {
  return (
    <WalletProvider>
      <HomePage />
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
  const { address, holdings, isHolder, openModal } = useWallet();

  const startPoster = () => {
    if (address) document.getElementById("top")?.scrollIntoView({ behavior: "smooth" });
    else openModal();
  };

  return (
    <>
      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#top">
            <HelmLogo className="brand__logo" />
            <span>
              <span className="brand__name">Wanted Bounty</span>
              <span className="brand__tag">$BERI • Community • Legendary</span>
            </span>
          </a>
          <nav className="nav" aria-label="Main">
            <a className="is-active" href="#top" aria-current="page">
              Home
            </a>
            <button type="button" onClick={startPoster}>
              Create Poster
            </button>
            <a href="#explore">Explore</a>
            <a href="#how-it-works">How It Works</a>
          </nav>
          <WalletButton />
        </div>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="container hero__inner">
            <div className="hero__copy">
              <p className="hero__eyebrow">Your name. Your story.</p>
              <h1 className="hero__title" aria-label="Wanted Bounty">
                <span>Wanted</span>
                <span>
                  B<BeriTarget className="hero__target" />
                  unty
                </span>
              </h1>
              <p className="hero__lede">
                Turn your identity into a wanted poster <br />
                for the BERI community.
              </p>
              <div className="cta-shadow">
                <button className="cta" type="button" style={{ clipPath: CTA_EDGE }} onClick={startPoster}>
                  <EditIcon />
                  {isHolder ? "Edit your poster" : "Create your poster"}
                  <ArrowRight />
                </button>
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
              portrait="/portraits/hero.jpg"
              seed={7}
            />
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
                  <h2 className="fleet__title">The Fleet’s Latest Bounties</h2>
                  <div className="fleet__divider">
                    <SkullIcon className="fleet__ornament" />
                  </div>
                </div>
                <a className="fleet__all" href="#explore">
                  View All Posters <ArrowRight />
                </a>
              </div>
              <FleetCarousel />
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <CompassRose className="site-footer__compass" />
        <CliffsArt className="site-footer__cliffs" />
        <HelmLogo className="site-footer__logo" />
        <p className="site-footer__motto">More than a token — a crew</p>
        <p className="site-footer__ticker">$BERI</p>
      </footer>
    </>
  );
}

function FleetCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="carousel">
      <button className="carousel__arrow carousel__arrow--prev" type="button" aria-label="Previous posters" onClick={() => scroll(-1)}>
        <ChevronLeft />
      </button>
      <div className="carousel__track" ref={trackRef}>
        {fleet.map((item, index) => (
          <article className="bounty-card" key={item.handle}>
            <WantedPoster name={item.name} bounty={item.bounty} portrait={item.portrait} seed={13 + index * 7} />
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
