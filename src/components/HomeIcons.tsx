type Props = { className?: string };

export function HomeWheel({ className }: Props) {
  return <svg className={className} viewBox="0 0 80 80" aria-hidden="true"><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="40" cy="40" r="26" strokeWidth="2.8"/><circle cx="40" cy="40" r="21" strokeWidth="1.2"/><circle cx="40" cy="40" r="5" strokeWidth="2"/>
    {Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45} 40 40)`}><path d="M40 35V10" strokeWidth="2.3"/><path d="M38 10V5Q40 1 42 5V10Z" fill="currentColor" strokeWidth="1"/></g>)}
    <path d="m40 18 4 18 18 4-18 4-4 18-4-18-18-4 18-4Z" strokeWidth="1.2"/>
  </g></svg>;
}
export function HomeCompass({className}:Props) {
  return <svg className={className} viewBox="0 0 80 80" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="40" cy="40" r="27"/><circle cx="40" cy="40" r="22"/><path d="M40 1V79M1 40H79M13 13l54 54M13 67l54-54"/><path d="m40 6 7 27 27 7-27 7-7 27-7-27-27-7 27-7Z"/><path d="m40 6 0 34 7-7ZM74 40H40l7 7ZM40 74V40l-7 7ZM6 40H40l-7-7Z" fill="currentColor"/><circle cx="40" cy="40" r="3" fill="#edcea0"/></g></svg>;
}
export function HomeHat({className}:Props) {
  return <svg className={className} viewBox="0 0 100 75" aria-hidden="true"><g transform="rotate(-12 50 40)" stroke="#39200f" strokeLinejoin="round"><ellipse cx="50" cy="49" rx="43" ry="15" fill="#d9ac68" strokeWidth="2.3"/><ellipse cx="50" cy="48" rx="38" ry="11" fill="none" strokeWidth=".9"/><path d="M24 45c0-39 52-39 52 0q-26 13-52 0Z" fill="#e7c28a" strokeWidth="2"/><path d="M24 36q26 12 52 0v9q-26 13-52 0Z" fill="#9c3e2e" strokeWidth="1.5"/><path d="m31 21-2 10m10-16-1 15m12-17v17m11-14 2 14m8-9 3 10M16 47l6 3m-1 4 8 2m-1-8 6 2m32 6 8-2m0-7 7-2m-40 12 8 1" fill="none" opacity=".6" strokeWidth="1"/></g></svg>;
}
export function HomeDiamond({className}:Props) {
  return <svg className={className} viewBox="0 0 80 80" aria-hidden="true"><g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round"><path d="m10 28 15-19h30l15 19-30 43Z"/><path d="M10 28h60M25 9l-5 19 20 43 20-43-5-19M20 28 40 9l20 19M25 9l30 0M20 28h40M40 9v62"/><path d="m25 9 15 19L55 9" strokeWidth="1.5"/></g></svg>;
}

export function HomeEmblem({ className, cherries = false }: Props & { cherries?: boolean }) {
  return <svg className={className} viewBox="0 0 88 88" aria-hidden="true">
    <g stroke="currentColor" fill="none" strokeLinecap="round">
      <circle cx="40" cy="40" r="28" strokeWidth="3"/><circle cx="40" cy="40" r="21" strokeWidth="1.7"/>
      {Array.from({length:8},(_,i)=><g key={i} transform={`rotate(${i*45} 40 40)`}><path d="M40 5v9" strokeWidth="3"/><circle cx="40" cy="4" r="2.3" fill="currentColor"/></g>)}
      <path d="M36 21v39m7-39v39" strokeWidth="1.3"/>
    </g>
    <text x="40" y="55" textAnchor="middle" fill="currentColor" fontFamily="Georgia,serif" fontSize="40" fontWeight="700">B</text>
    {cherries && <g stroke="#3c210f" strokeWidth="1.2"><path d="M66 66q7-12 10-17m-1 4q-1 13 3 19" fill="none"/><path d="M74 54q-9-9-15-1 9 4 15 1m0-1q4-9 13-7-3 8-13 7" fill="#485638"/><circle cx="66" cy="70" r="7" fill="#a63126"/><circle cx="79" cy="75" r="7" fill="#b5402c"/><path d="m62 68 2-2m12 7 2-2" stroke="#e7a26e" strokeWidth="2"/></g>}
  </svg>;
}
