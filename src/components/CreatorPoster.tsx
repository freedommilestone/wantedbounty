import type { CSSProperties } from "react";
import { PosterScroll } from "./icons";
import "./CreatorPoster.css";

type Props = { name: string; bounty: string; portrait: string; photoClassName: string; fine: string };

/** Creator-specific composition, with live text and a separately illustrated paper frame. */
export function CreatorPoster({ name, bounty, portrait, photoClassName, fine }: Props) {
  const nameSize = Math.min(15, 138 / Math.max(name.length, 8));
  const bountySize = Math.min(10.5, 112 / Math.max(bounty.length, 10));
  return <div className="poster-frame creator-poster" style={{ "--creator-name-size": `${nameSize}cqw`, "--creator-bounty-size": `${bountySize}cqw` } as CSSProperties}>
    <article className="creator-poster__sheet" aria-label={`Wanted poster for ${name}`}>
      <h3 className="creator-poster__wanted">WANTED</h3>
      <div className={`creator-poster__portrait ${photoClassName}`}><img src={portrait} alt={`Portrait of ${name}`} /></div>
      <p className="creator-poster__alive">DEAD OR ALIVE</p>
      <p className="creator-poster__name">{name}</p>
      <p className="creator-poster__bounty"><span>฿</span> {bounty} <small>BERI</small></p>
      <PosterScroll className="creator-poster__scroll creator-poster__scroll--left" />
      <PosterScroll className="creator-poster__scroll creator-poster__scroll--right" />
      <p className="creator-poster__fine" aria-hidden="true">{fine}</p>
      <p className="creator-poster__marine">MARINE</p>
    </article>
  </div>;
}
