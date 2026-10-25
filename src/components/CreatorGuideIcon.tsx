/** Separate ink-style symbols for the four creator instructions. */
export function CreatorGuideIcon({ step }: { step: number }) {
  return <svg className={`steps__icon creator-guide-icon creator-guide-icon--${step}`} viewBox="0 0 72 72" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {step === 0 && <g transform="rotate(-6 36 36)">
        <path d="m15 8 6 1 4-3 5 2 5-2 5 2 6-2 5 2 5-1-1 7 2 4-2 5 1 6-2 6 2 6-1 5 1 6-2 6 1 7-6-1-4 2-5-1-5 2-5-2-5 1-5-2-5 1 1-7-2-5 2-5-1-7 1-6-2-5 2-5Z"/>
        <path d="m19 12 32-1-1 49-31 1Z" strokeWidth=".7"/>
        <text x="35" y="22" textAnchor="middle" stroke="none" fill="currentColor" fontFamily="Georgia,serif" fontWeight="900" fontSize="10">WANTED</text>
        <path d="M22 27h26v20H22Z" strokeWidth=".8"/>
        <path d="m24 43 5-10 4 5 4-8 8 13ZM25 36l3-4 3 2m9 0 3 3" fill="currentColor" strokeWidth="1"/>
        <path d="M22 51h26m-24 3h22m-20 3h18" strokeWidth="1"/>
        <path d="m28 8 7-6 8 6"/>
      </g>}
      {step === 1 && <>
        <path d="m13 7 49 49-9 9L4 16Z" fill="#e7c697"/>
        <path d="m16 14-5 5m12 2-4 4m11 3-5 5m12 2-4 4m11 3-5 5m12 2-4 4m11 3-5 5" strokeWidth="1.5"/>
        <path d="m8 64 5-17L51 9q3-3 6 0l6 6q3 3 0 6L25 59Z" fill="#e7c697" strokeWidth="2.6"/>
        <path d="m13 47 12 12m22-46 12 12M17 49l35-35m-30 40 35-35"/>
        <path d="m8 64 3-9 6 6Z" fill="currentColor"/>
      </>}
      {step === 2 && <>
        <path d="M35 3C16 2 3 18 4 36S18 68 37 67 68 51 67 33 53 3 35 3Z" strokeWidth="1.3"/>
        <path d="m8 19-2-1m-2 19-2 1m17 24-1 3m30-1 1 3m17-19 3 1m-4-29 2-2M43 4l1-2"/>
        <path d="M20 24q0-4 5-4h24v7H25q-5 0-5-3v27h33V27H25" fill="currentColor"/>
        <path d="M24 26h27v22H24Z" stroke="#ead0a4" strokeWidth="1.3"/>
        <path d="M45 33h10v10H45q-6-5 0-10Z" fill="#ead0a4" strokeWidth="1.2"/>
        <circle cx="47" cy="38" r="1.5" fill="currentColor" stroke="none"/>
      </>}
      {step === 3 && <>
        <circle cx="36" cy="23" r="10"/><path d="M20 58V45c0-16 32-16 32 0v13Z" strokeWidth="2.5"/>
        <path d="M23 18c-13-10-23 10-11 16m37-16c13-10 23 10 11 16M19 36C6 31 3 45 4 52h16m32-16c13-5 16 9 15 16H52" strokeWidth="2.5"/>
      </>}
    </g>
  </svg>;
}
