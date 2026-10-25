import { useState } from "react";
import { Link } from "../router";
import { WalletButton } from "./WalletButton";

type Page = "home" | "create" | "how";

export function SiteHeader({ active }: { active: Page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const links: { label: string; href: string; page?: Page }[] = [
    { label: "Home", href: "/", page: "home" },
    { label: "Create Poster", href: "/create", page: "create" },
    { label: "Explore", href: "/#explore" },
    { label: "How It Works", href: "/how-it-works", page: "how" },
  ];

  return (
    <header className={`site-header ${active === "create" ? "site-header--create" : "site-header--home"}`}>
      <div className="container site-header__inner">
        <Link className="brand" href="/" aria-label="Wanted Bounty home">
          <img className="brand__logo" src="/brand/beri-monogram.png" alt="" style={{ objectFit: "contain", transform: "scale(0.8)" }} />
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
          {active === "home" && <div className="mobile-nav-wallet"><WalletButton /></div>}
        </nav>
        <WalletButton />
      </div>
    </header>
  );
}
