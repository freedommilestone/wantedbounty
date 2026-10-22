import { Link } from "../router";
import { HelmLogo } from "./icons";
import { WalletButton } from "./WalletButton";

type Page = "home" | "create";

export function SiteHeader({ active }: { active: Page }) {
  const links: { label: string; href: string; page?: Page }[] = [
    { label: "Home", href: "/", page: "home" },
    { label: "Create Poster", href: "/create", page: "create" },
    { label: "Explore", href: "/#explore" },
    { label: "How It Works", href: active === "create" ? "/create#how-it-works" : "/#how-it-works" },
  ];

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link className="brand" href="/">
          <HelmLogo className="brand__logo" />
          <span>
            <span className="brand__name">Wanted Bounty</span>
            <span className="brand__tag">$BERI • Community • Legendary</span>
          </span>
        </Link>
        <nav className="nav" aria-label="Main">
          {links.map(({ label, href, page }) => {
            const current = page === active;
            return (
              <Link
                key={label}
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
