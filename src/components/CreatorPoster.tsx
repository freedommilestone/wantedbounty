import { BeriSymbol } from "./BeriSymbol";
import { wholeBounty } from "../bountyFormat";

type Props = { name: string; condition?: string; bounty: string; portrait: string; photoClassName: string; fine: string; className?: string; portraitIndex?: number };

/** Separate paper, portrait and live lettering, shared by preview and PNG export. */
export function CreatorPoster({ name, condition = "DEAD OR ALIVE", bounty, portrait, photoClassName, fine, className = "", portraitIndex }: Props) {
  const amount = wholeBounty(bounty);
  return <div className={`poster-frame creator-poster poster-reference ${className}`}>
    <article className="creator-poster__sheet" aria-label={`Wanted poster for ${name}`}>
      <svg className="creator-poster__wanted" viewBox="0 15 520 110" preserveAspectRatio="none" role="img" aria-label="WANTED"><text x="260" y="119" textAnchor="middle" textLength="515" lengthAdjust="spacingAndGlyphs">WANTED</text></svg>
      <div className={`creator-poster__portrait ${photoClassName}`}>{portraitIndex === undefined ? <img src={portrait} alt={`Portrait of ${name}`} /> : <div role="img" aria-label={`Portrait of ${name}`} style={{width:"100%",height:"100%",backgroundImage:`url(${portrait})`,backgroundSize:"500% 300%",backgroundPosition:`${(portraitIndex % 5)*25}% ${Math.floor(portraitIndex/5)*50}%`}} />}</div>
      <svg className="creator-poster__alive" viewBox="0 8 460 38" preserveAspectRatio="none" role="img" aria-label={condition}><text x="230" y="42" textAnchor="middle" textLength={condition === "DEAD OR ALIVE" ? 450 : undefined} lengthAdjust={condition === "DEAD OR ALIVE" ? "spacingAndGlyphs" : undefined}>{condition}</text></svg>
      <svg className="creator-poster__name" viewBox="0 12 460 68" preserveAspectRatio="none" role="img" aria-label={name}><text x="230" y="77" textAnchor="middle" textLength="450" lengthAdjust="spacingAndGlyphs">{name.toUpperCase()}</text></svg>
      <svg className="creator-poster__bounty" viewBox="0 0 450 65" role="img" aria-label={`${amount} BERI`}><BeriSymbol x="0" y="0" width="45" height="65"/><text x="252" y="49" textAnchor="middle" textLength="370" lengthAdjust="spacing">{amount}−</text></svg>
      <PosterFlourish className="creator-poster__scroll creator-poster__scroll--left" />
      <PosterFlourish className="creator-poster__scroll creator-poster__scroll--right" />
      <p className="creator-poster__fine" aria-hidden="true">{fine}</p>
      <svg className="creator-poster__marine" viewBox="0 8 180 46" preserveAspectRatio="none" role="img" aria-label="Marine"><text x="90" y="51" textAnchor="middle" textLength="176" lengthAdjust="spacingAndGlyphs">MARINE</text></svg>
    </article>
  </div>;
}

function PosterFlourish({className}:{className:string}) {
  return <svg className={className} viewBox="0 0 20 180" preserveAspectRatio="none" aria-hidden="true"><path d="M13 16C22 6 10-6 5 9C-2 28 17 44 14 58C12 71 1 73 3 61C4 54 11 56 9 62M8 84C-1 76 1 68 7 72C22 84 3 113 4 136C4 156 17 162 16 173C15 184 4 178 7 168" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/></svg>;
}
