/** Ink silhouettes matching the parchment navigation and featured-gallery artwork. */
export function PirateSkullIcon({className=""}:{className?:string}) {
  return <svg className={className} viewBox="0 0 52 48" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="4" strokeLinecap="round"><path d="M7 7 45 40M7 40 45 7"/></g>
    <g fill="currentColor"><circle cx="5" cy="6" r="3"/><circle cx="9" cy="4" r="3"/><circle cx="44" cy="4" r="3"/><circle cx="48" cy="7" r="3"/><circle cx="5" cy="40" r="3"/><circle cx="9" cy="43" r="3"/><circle cx="44" cy="43" r="3"/><circle cx="48" cy="40" r="3"/>
    <path d="M13 21c0-8 5-12 13-12s13 4 13 12c0 6-3 9-7 11v7H20v-7c-4-2-7-5-7-11Z"/>
    <path d="M9 19c1-6 7-8 17-8s16 2 17 8c-5 4-29 4-34 0ZM16 14c0-8 5-11 10-11s10 3 10 11Z"/></g>
    <path d="M16 13h20" stroke="#edd4a6" strokeWidth="2"/>
    <g fill="#edd4a6"><ellipse cx="21" cy="25" rx="3.5" ry="4"/><ellipse cx="31" cy="25" rx="3.5" ry="4"/><path d="m26 29-2 4h4Z"/></g>
    <path d="M22 35v4m4-4v4m4-4v4" stroke="#edd4a6" strokeWidth="1.5"/>
  </svg>;
}
export function HeaderWalletIcon() {
  return <svg className="header-wallet-icon" width="32" height="30" viewBox="0 0 34 30" fill="none" aria-hidden="true">
    <g stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" strokeLinecap="round">
      <path d="M5 8V5c0-1.2 1-2 2-2h19l3 6M10 3l3 5m8-5 3 5"/>
      <path d="M5 8h24c1.2 0 2 1 2 2v15c0 1.2-.8 2-2 2H5c-1.2 0-2-1-2-2V10c0-1.2.8-2 2-2Z"/>
      <path d="M31 14h-8v7h8"/>
    </g><circle cx="25.5" cy="17.5" r="1.3" fill="currentColor"/>
  </svg>;
}
