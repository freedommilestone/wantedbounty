import { PosterScroll } from "./icons";
import "./CreatorPoster.css";

type Props = { name: string; condition?: string; bounty: string; portrait: string; photoClassName: string; fine: string };

/** Separate paper, portrait and live lettering, shared by preview and PNG export. */
export function CreatorPoster({ name, condition = "DEAD OR ALIVE", bounty, portrait, photoClassName, fine }: Props) {
  return <div className="poster-frame creator-poster">
    <article className="creator-poster__sheet" aria-label={`Wanted poster for ${name}`}>
      <svg className="creator-poster__paper" viewBox="0 0 560 820" preserveAspectRatio="none" aria-hidden="true">
        <path d="M3 3 Q65 5 110 2 L224 4 335 2 450 4 557 3 Q559 130 556 240 L558 400 556 590 558 817 Q480 815 410 818 L270 816 135 818 2 816 Q5 700 2 580 L4 360 2 190Z" fill="#dbccb7" stroke="#49372f" strokeWidth="2" />
        <path d="M95 3v7m5-7 1 10m5-10v5m342-3 1 12m5-12v17M3 258l10-1m-10 5h7m-7 7 13-2M3 483h12m-12 5h8m-8 12h14M74 817v-6m6 6-1-9m170 9v-8m5 8v-5m243 3v-9m5 9v-6" fill="none" stroke="#49372f" strokeWidth="1" />
      </svg>
      <svg className="creator-poster__wanted" viewBox="0 0 520 140" role="img" aria-label="WANTED"><text x="260" y="119" textAnchor="middle" textLength="515" lengthAdjust="spacingAndGlyphs">WANTED</text></svg>
      <div className={`creator-poster__portrait ${photoClassName}`}><img src={portrait} alt={`Portrait of ${name}`} /></div>
      <svg className="creator-poster__alive" viewBox="0 0 460 50" role="img" aria-label={condition}><text x="230" y="42" textAnchor="middle" textLength={condition === "DEAD OR ALIVE" ? 450 : undefined} lengthAdjust={condition === "DEAD OR ALIVE" ? "spacingAndGlyphs" : undefined}>{condition}</text></svg>
      <svg className="creator-poster__name" viewBox="0 0 460 90" role="img" aria-label={name}><text x="230" y="77" textAnchor="middle" textLength="450" lengthAdjust="spacingAndGlyphs">{name.toUpperCase()}</text></svg>
      <svg className="creator-poster__bounty" viewBox="0 0 450 55" role="img" aria-label={`${bounty} BERI`}><text x="225" y="43" textAnchor="middle" textLength="430" lengthAdjust="spacingAndGlyphs">฿ {bounty}<tspan className="creator-poster__desktop-unit" fontSize="30"> BERI</tspan><tspan className="creator-poster__standard-unit">−</tspan></text></svg>
      <PosterScroll className="creator-poster__scroll creator-poster__scroll--left" />
      <PosterScroll className="creator-poster__scroll creator-poster__scroll--right" />
      <p className="creator-poster__fine" aria-hidden="true">{fine}</p>
      <svg className="creator-poster__marine" viewBox="0 0 180 60" role="img" aria-label="Marine"><text x="90" y="51" textAnchor="middle" textLength="176" lengthAdjust="spacingAndGlyphs">MARINE</text></svg>
    </article>
  </div>;
}
