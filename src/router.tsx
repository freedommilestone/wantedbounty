import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

const NAVIGATE_EVENT = "wantedbounty:navigate";

function scrollToHash(hash: string) {
  if (!hash) {
    window.scrollTo({ top: 0 });
    return;
  }
  requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" }));
}

export function navigate(to: string) {
  const url = new URL(to, window.location.href);
  const samePage = url.pathname === window.location.pathname;
  if (url.href !== window.location.href) window.history.pushState(null, "", url);
  window.dispatchEvent(new Event(NAVIGATE_EVENT));
  if (samePage && url.hash) scrollToHash(url.hash);
  else scrollToHash(samePage ? "" : url.hash);
}

export function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener("popstate", sync);
    window.addEventListener(NAVIGATE_EVENT, sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener(NAVIGATE_EVENT, sync);
    };
  }, []);

  useEffect(() => {
    if (window.location.hash) scrollToHash(window.location.hash);
  }, [path]);

  return path;
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={handleClick} {...rest} />;
}
