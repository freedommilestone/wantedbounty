type ExploreIconKind = 'trending' | 'newest' | 'highest' | 'mine' | 'search' | 'verified' | 'create';
/** Consistent ink icons for the parchment gallery controls. */
export function ExploreIcon({kind}:{kind:ExploreIconKind}) {
 return <svg className="explore-control-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
  {kind==='trending'&&<path fill="currentColor" stroke="none" d="M17 2c1 8 10 10 10 18 0 7-5 11-11 11S5 27 5 21c0-5 4-9 5-13 1 4 1 6 3 8 3-4 4-8 4-14Zm0 15c-1 5-5 6-5 9 0 3 7 3 7-1 0-2-1-5-2-8Z"/>}
  {kind==='newest'&&<><circle cx="16" cy="16" r="12"/><path d="M16 7v9l6 3M16 4v2M4 16h2M26 16h2M16 26v2"/></>}
  {kind==='highest'&&<><path d="m4 9 6 6 6-10 6 10 6-6-3 16H7ZM8 29h16"/><circle cx="4" cy="7" r="1"/><circle cx="16" cy="3" r="1"/><circle cx="28" cy="7" r="1"/></>}
  {kind==='mine'&&<><circle cx="16" cy="9" r="5" fill="currentColor"/><path d="M6 29v-4c0-6 4-9 10-9s10 3 10 9v4Z" fill="currentColor"/><path d="M16 19v10" stroke="#efd7ae" strokeWidth="1"/></>}
  {kind==='search'&&<><circle cx="13" cy="13" r="9"/><path d="m20 20 9 9"/></>}
  {kind==='verified'&&<><path d="M16 3c4 3 7 4 11 4v10c0 6-5 10-11 13C10 27 5 23 5 17V7c4 0 7-1 11-4Z"/><path d="m11 16 4 4 7-8"/></>}
  {kind==='create'&&<><path d="M24 18v10H4V5h14M8 9h3M8 14h3M8 23l2-7L24 2l6 6-14 14-8 1ZM21 5l6 6M10 16l6 6"/></>}
 </svg>;
}
