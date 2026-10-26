import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./MobileNavigation.css";
import { Link } from "../router";
import { useWallet } from "../wallet";
import { HomeCompass, HomeWheel, HomeEmblem } from "./HomeIcons";
import { WalletButton } from "./WalletButton";

type Page = "home" | "create" | "how" | "explore";

export function SiteHeader({ active }: { active: Page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { modalOpen } = useWallet();
  useEffect(() => { if (modalOpen) setMenuOpen(false); }, [modalOpen]);
  const drawerRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const drawer = drawerRef.current;
    drawer?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const query = matchMedia(active === "create" ? "(max-width:1100px)" : "(max-width:900px)");
    const onResize = () => { if (!query.matches) setMenuOpen(false); };
    query.addEventListener("change", onResize);
    return () => {
      drawer?.close();
      document.body.style.overflow = previousOverflow;
      query.removeEventListener("change", onResize);
    };
  }, [menuOpen, active]);
  const links: { label: string; href: string; page?: Page }[] = [
    { label: "Home", href: "/", page: "home" },
    { label: "Create Poster", href: "/create", page: "create" },
    { label: "Explore", href: "/explore", page: "explore" },
    { label: "How It Works", href: "/how-it-works", page: "how" },
  ];

  return (
    <header className={`site-header ${active === "create" ? "site-header--create" : "site-header--home"}`}>
      <div className="container site-header__inner">
        <Link className="brand" href="/" aria-label="Wanted Bounty home">
          <img className="brand__logo" src="/brand/beri-monogram.png" alt="" style={{ objectFit: "contain", transform: "scale(0.8)" }} />
        </Link>
        <button className="site-menu-toggle" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <nav id="site-navigation" className="nav" aria-label="Main">
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
      {menuOpen && createPortal(
        <dialog ref={drawerRef} id="mobile-navigation" className="mobile-navigation" aria-label="Navigation"
          onCancel={() => setMenuOpen(false)}
          onClick={(event) => { if (event.target === event.currentTarget) {
            const box = event.currentTarget.getBoundingClientRect();
            if (event.clientX < box.left || event.clientX > box.right) setMenuOpen(false);
          } }}>
          <div className="mobile-navigation__surface">
          <div className="mobile-navigation__heading">
            <div className="mobile-navigation__brand"><HomeEmblem cherries /><strong>BERI BOUNTY</strong><small>$BERI · COMMUNITY · LEGENDARY</small></div>
            <button type="button" autoFocus aria-label="Close navigation" onClick={() => setMenuOpen(false)}>×</button>
          </div>
          <nav aria-label="Mobile main">
            {links.map(({ label, href, page }) => <Link key={href} href={href}
              aria-current={page === active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}>
                <span className="mobile-navigation__icon"><MenuIcon page={page} /></span>
                <span className="mobile-navigation__label">{label}</span><span aria-hidden="true">→</span></Link>)}
          </nav>
          <div className="mobile-navigation__wallet"><WalletButton /></div>
          <div className="mobile-navigation__scenery" aria-hidden="true" />
          </div>
        </dialog>, document.body)}
    </header>
  );
}

function MenuIcon({ page }: { page?: Page }) {
  if (page === "home") return <HomeCompass />;
  if (page === "how") return <HomeWheel />;
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" aria-hidden="true">
    {page === "explore" ? <><path d="m4 10 13-5 14 6 13-5v32l-13 5-14-6-13 5Z M17 5v32m14-26v32"/><path d="m11 29 8-9 8 8 10-12m-3 0 6 5m0-5-6 5" strokeDasharray="3 2"/></> : <><path d="m10 6 26-3 4 39-27 3Z"/><path d="m16 12 15-2m-12 27 14-1"/><circle cx="25" cy="23" r="6" fill="currentColor"/><path d="m18 32 15-15m-16 2 16 12"/><circle cx="23" cy="22" r="1" stroke="#e9cd9d"/><circle cx="27" cy="22" r="1" stroke="#e9cd9d"/></>}
  </svg>;
}
