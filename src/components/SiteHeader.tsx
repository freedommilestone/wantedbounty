import { useState } from "react";
import { Link } from "../router";
import { HomeEmblem } from "./HomeIcons";
import { HelmLogo } from "./icons";
import { WalletButton } from "./WalletButton";

type Page = "home" | "create";

export function SiteHeader({ active }: { active: Page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links: { label: string; href: string; page?: Page }[] = [
    { label: "Home", href: "/", page: "home" },
    { label: "Create Poster", href: "/create", page: "create" },
    { label: "Explore", href: "/#explore" },
    { label: "How It Works", href: active === "create" ? "/create#how-it-works" : "/#how-it-works" },
  ];

  return (
    <header className={`site-header ${active === "create" ? "site-header--create" : "site-header--home"}`}>
      <div className="container site-header__inner">
        <Link className="brand" href="/">
          {active === "home" ? <HomeEmblem className="brand__logo" cherries /> : <HelmLogo className="brand__logo" />}
          <span>
            <span className="brand__name">{active === "home" ? "Beri Bounty" : "Wanted Bounty"}</span>
            <span className="brand__tag">$BERI • Community • Legendary</span>
          </span>
        </Link>
        <button className="site-menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <nav id="site-navigation" className={`nav ${menuOpen ? "nav--open" : ""}`} aria-label="Main">
          {links.map(({ label, href, page }) => {
            const current = page === active;
            return (
              <Link
                key={label}
                onClick={() => setMenuOpen(false)}
                href={href}
                className={current ? "is-active" : undefined}
                aria-current={current ? "page" : undefined}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
