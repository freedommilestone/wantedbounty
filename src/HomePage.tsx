"use client";
import { HomePreloader } from "./components/HomePreloader";
import { SiteHeader } from "./components/SiteHeader";
import { CreatorPoster } from "./components/CreatorPoster";
import { CompassRose } from "./components/icons";
import { HomeWheel, HomeCompass, HomeHat, HomeDiamond } from "./components/HomeIcons";
import { Link } from "./router";

const features = [
  { Icon: HomeWheel, title: "Personalize\nyour poster", href: "/create" },
  { Icon: HomeHat, title: "BERI holder\nidentity", href: "/profile" },
  { Icon: HomeCompass, title: "Share & explore", href: "/explore" },
  { Icon: HomeDiamond, title: "Build the legend", href: "/how-it-works" },
];
const fine = "KONO SAKUHIN WA FICTION DESUNODE JITSUZAISURU JINBUTSU DANTAI SONOTA NO SOSHIKI TO DOITSU NO MEISHOU GA GEKICHU NI TOUJYOU SHITATOSHITEMO JITSUZAI NA MONOTOWA ISSAI MUKANKEIDESU";

export function HomePage() {
  return (
    <div className="home-page landing-page">
      <HomePreloader />
      <SiteHeader active="home" primaryAction="play" />
      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="landing-hero__eyebrow">Your name. Your story.</p>
            <h1 id="landing-title"><span>Wanted</span><span>Bounty</span></h1>
            <p className="landing-hero__description">Turn your identity into a wanted poster<br />for the BERI community.</p>
          </div>
          <Link className="landing-hero__poster" href="/create" aria-label="Create your own wanted poster">
            <CreatorPoster name="Your Name" bounty="1,500,000,000" portrait="/portraits/home-luffy.jpg" photoClassName="" fine={fine} />
          </Link>
          <div className="landing-hero__motto" aria-hidden="true">
            <span>Every legend<br />has a price.</span>
            <CompassRose />
          </div>
        </section>
        <nav className="landing-features" aria-label="Discover Wanted Bounty">
          {features.map(({ Icon, title, href }) => (
            <Link className="landing-feature" key={href} href={href}>
              <Icon />
              <span>{title}</span>
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
}
