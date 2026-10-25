import { useId } from "react";
import "./ExplorePoster.css";

/** Gallery-specific poster: fixed print coordinates keep small cards and previews identical. */
export function ExplorePoster({name,bounty,portrait}:{name:string;bounty:number;portrait:string}) {
  const id=useId().replace(/:/g,"");
  return <div className="explore-poster"><svg viewBox="0 0 160 200" role="img" aria-label={`Wanted: ${name}, ${bounty.toLocaleString("en-US")} BERI`}>
    <defs><clipPath id={id}><rect x="12" y="40" width="136" height="82"/></clipPath></defs>
    <text className="explore-poster-wanted" x="80" y="35" textAnchor="middle" textLength="145" lengthAdjust="spacingAndGlyphs">WANTED</text>
    <image href={portrait} x="12" y="40" width="136" height="82" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`}/>
    <rect x="12" y="40" width="136" height="82" fill="none" stroke="#38210e" strokeWidth=".7"/>
    <text x="80" y="135" textAnchor="middle" className="explore-poster-alive" textLength="119" lengthAdjust="spacingAndGlyphs">DEAD OR ALIVE</text>
    <text x="80" y="155" textAnchor="middle" className="explore-poster-name" textLength={Math.min(125,name.length*12)} lengthAdjust="spacingAndGlyphs">{name.toUpperCase()}</text>
    <text x="80" y="172" textAnchor="middle" className="explore-poster-amount" textLength="121" lengthAdjust="spacingAndGlyphs">฿ {bounty.toLocaleString("en-US")}–</text>
    <path d="M14 128c-10-9-12 6-5 7s5 11-1 17 4 14 3 20-7 8-3 12 8 0 4-3M146 128c10-9 12 6 5 7s-5 11 1 17-4 14-3 20 7 8 3 12-8 0-4-3" fill="none" stroke="#301909" strokeWidth="1.4"/>
    <text x="105" y="190" className="explore-poster-marine" textLength="46" lengthAdjust="spacingAndGlyphs">MARINE</text>
    <path d="M21 180h72m-72 3h65m-65 3h69m-69 3h56" stroke="#513519" strokeWidth=".4" opacity=".6"/>
  </svg></div>;
}
