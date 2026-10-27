/** Vector marks remain sharp inside the illustrated parchment buttons. */
export function FleetWalletIcon({wallet}:{wallet:'phantom'|'metamask'}) {
  if(wallet==='phantom') return <svg className="wallet-option__icon" viewBox="0 0 80 80" aria-hidden="true">
    <defs><linearGradient id="fleet-ghost" x1="0" y1="1" x2="1" y2="0"><stop stopColor="#ad76f5"/><stop offset="1" stopColor="#fff6dd"/></linearGradient></defs>
    <path fill="url(#fleet-ghost)" d="M9 61C12 39 30 13 49 12c16-1 23 12 21 27-1 15-11 26-19 24-3-1-4-4-4-7-5 9-10 14-16 11-3-1-4-4-3-8-7 9-13 13-17 9-2-2-3-4-2-7Z"/>
    <ellipse cx="48" cy="31" rx="3" ry="5.5" fill="#1b100e"/><ellipse cx="60" cy="30" rx="3" ry="5.5" fill="#1b100e"/>
  </svg>;
  return <svg className="wallet-option__icon" viewBox="0 0 80 80" aria-hidden="true">
    <path d="M8 9 33 25 47 25 72 9 67 37 71 63 52 59 40 69 28 59 9 63 13 37Z" fill="#e2761b"/>
    <path d="m8 9 25 16-12 17-8-5Zm64 0L47 25l12 17 8-5Z" fill="#c45b13"/>
    <path d="m21 42 12-17 7 22 7-22 12 17-7 17-12 10-12-10Z" fill="#f79735"/>
    <path d="m21 42 12 3-3 8Zm38 0-12 3 3 8Z" fill="#593122"/>
    <path d="m28 59 5-7h14l5 7-12 10Z" fill="#ecd5b9"/><path d="m33 56 7-2 7 2-3 6h-8Z" fill="#271912"/>
    <path d="m13 37 8 5 7 17-19 4Zm54 0-8 5-7 17 19 4Z" fill="#d66b19"/>
  </svg>;
}
