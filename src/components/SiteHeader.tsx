import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./MobileNavigation.css";
import { Link } from "../router";
import { WalletButton } from "./WalletButton";

type Page = "home" | "create" | "how" | "explore";

export function SiteHeader({ active }: { active: Page }) {
  const [menuOpen, setMenuOpen] = useState(false);
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
          <div className="mobile-navigation__heading">
            <img src="/brand/beri-monogram.png" alt="Wanted Bounty" />
            <button type="button" autoFocus aria-label="Close navigation" onClick={() => setMenuOpen(false)}>×</button>
          </div>
          <nav aria-label="Mobile main">
            {links.map(({ label, href, page }) => <Link key={href} href={href}
              aria-current={page === active ? "page" : undefined}
              onClick={() => setMenuOpen(false)}>{label}<span aria-hidden="true">→</span></Link>)}
          </nav>
        </dialog>, document.body)}
    </header>
  );
}
