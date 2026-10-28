import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./MobileNavigation.css";
import "./SiteHeader.css";
import { Link } from "../router";
import { useWallet } from "../wallet";
import { HomeCompass, HomeWheel } from "./HomeIcons";
import { WalletButton } from "./WalletButton";

type Page = "home" | "create" | "how" | "explore" | "profile";

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
    const query = matchMedia("(max-width:1100px)");
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
    { label: "My Profile", href: "/profile", page: "profile" },
  ];

  return (
    <header className={`site-header ${active === "create" ? "site-header--create" : "site-header--home"}`}>
      <div className="container site-header__inner">
        <Link className="brand" href="/" aria-label="Wanted Bounty home">
          {<span className="create-mobile-brand"><img className="wanted-brand-logo" src="/brand/wanted-bounty-logo.png" alt=""/><span><strong>WANTED BOUNTY</strong><small>$BERI · COMMUNITY · LEGENDARY</small></span></span>}
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
            <div className="mobile-navigation__brand"><img className="wanted-brand-logo" src="/brand/wanted-bounty-logo.png" alt="Wanted Bounty"/></div>
            <button type="button" autoFocus aria-label="Close navigation" onClick={() => setMenuOpen(false)}>×</button>
          </div>
          <nav aria-label="Mobile main">
            {links.map(({ label, href, page }) => <Link key={href} href={href}
              aria-current={page === active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}>
                <span className="mobile-navigation__icon"><MenuIcon page={page} /></span>
                <span className="mobile-navigation__label">{label}</span><span aria-hidden="true">→</span></Link>)}
          </nav>
          <div className="mobile-navigation__divider" aria-hidden="true"><span/><NavigationSkull/><span/></div>
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
  if (page === "profile") return <svg viewBox="0 0 48 48" aria-hidden="true" fill="currentColor"><path d="M6 46c0-11 6-16 18-16s18 5 18 16ZM14 22h20c0 17-20 17-20 0ZM13 17c0-15 22-15 22 0Z"/><ellipse cx="24" cy="19" rx="20" ry="3"/><path d="M14 15h20" stroke="#e9cd9d" strokeWidth="1.2"/></svg>;
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" aria-hidden="true">
    {page === "explore" ? <><path d="m4 10 13-5 14 6 13-5v32l-13 5-14-6-13 5Z M17 5v32m14-26v32"/><path d="m11 29 8-9 8 8 10-12m-3 0 6 5m0-5-6 5" strokeDasharray="3 2"/></> : <><path d="m10 6 26-3 4 39-27 3Z"/><path d="m16 12 15-2m-12 27 14-1"/><circle cx="25" cy="23" r="6" fill="currentColor"/><path d="m18 32 15-15m-16 2 16 12"/><circle cx="23" cy="22" r="1" stroke="#e9cd9d"/><circle cx="27" cy="22" r="1" stroke="#e9cd9d"/></>}
  </svg>;
}

function NavigationSkull() {
 return <svg viewBox="0 0 90 80" fill="none" stroke="#3a1909" strokeWidth="2.4" strokeLinejoin="round" aria-hidden="true">
  <path d="m14 7 63 61m-1-61L14 68" strokeWidth="7"/>
  <g fill="#edd4a6"><path d="M9 3c-6 1-7 9-1 10-4 6 4 10 8 4L24 9C20 4 14 8 14 5S11 2 9 3ZM81 3c6 1 7 9 1 10 4 6-4 10-8 4l-8-8c4-5 10-1 10-4s3-3 5-2ZM9 65c-6 1-7 9-1 10 2 5 8 4 8-1l7-8-6-6ZM81 65c6 1 7 9 1 10-2 5-8 4-8-1l-7-8 6-6Z"/>
  <path d="M22 31c0-23 46-23 46 0v12c0 10-8 14-12 17v9c-7 6-15 6-22 0v-9c-5-3-12-7-12-17Z"/></g>
  <g fill="#321709" stroke="none"><ellipse cx="35" cy="43" rx="7" ry="8"/><ellipse cx="55" cy="43" rx="7" ry="8"/><path d="m45 48-4 7h8Z"/></g>
  <path d="M34 60q11 6 22 0m-17 0v11m6-9v11m6-13v11" strokeWidth="1.4"/>
  <path d="M24 22c0-29 42-29 42 0Z" fill="#d29b52"/>
  <path d="M24 18h42v6H24Z" fill="#a82f20"/>
  <path d="M9 25q36-9 72 0v4H9Z" fill="#e7b367"/>
 </svg>;
}
