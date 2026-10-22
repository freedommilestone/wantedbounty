import type { CSSProperties } from "react";
import { tornPaper } from "../torn";
import { PosterScroll } from "./icons";

const DEFAULT_FINE =
  "By order of the Beri Fleet, this pirate is wanted on every sea. Any crew member who brings word of their whereabouts shall be rewarded in full. Holders of $BERI may claim and share this poster.";

interface WantedPosterProps {
  name: string;
  bounty: string;
  portrait: string;
  seed?: number;
  className?: string;
  nameIsAddress?: boolean;
  bountySuffix?: string;
  photoClassName?: string;
  fine?: string;
}

export function WantedPoster({
  name,
  bounty,
  portrait,
  seed = 3,
  className = "",
  nameIsAddress = false,
  bountySuffix = "-",
  photoClassName = "",
  fine = DEFAULT_FINE,
}: WantedPosterProps) {
  const nameSize = Math.min(13, 70 / (Math.max(name.length, 4) * 0.72));
  const bountyText = `${bounty}${bountySuffix}`;
  const bountySize = Math.min(7.8, 60 / (Math.max(bountyText.length, 8) * 0.62));

  return (
    <div className={`poster-frame ${className}`}>
      <article className="poster" style={{ clipPath: tornPaper(seed) }}>
        <h3 className="poster__wanted">WANTED</h3>
        <div className={`poster__photo ${photoClassName}`}>
          <img src={portrait} alt={`Portrait of ${name}`} loading="lazy" />
        </div>
        <div className="poster__lower">
          <PosterScroll className="poster__scroll" />
          <div>
            <p className="poster__alive">DEAD OR ALIVE</p>
            <p
              className={`poster__name ${nameIsAddress ? "poster__name--address" : ""}`}
              style={{ "--name-size": `${nameSize}cqw` } as CSSProperties}
            >
              {name}
            </p>
            <p className="poster__bounty" style={{ "--bounty-size": `${bountySize}cqw` } as CSSProperties}>
              <span className="poster__beri">฿</span>
              {bountyText}
            </p>
          </div>
          <PosterScroll className="poster__scroll poster__scroll--right" />
        </div>
        <div className="poster__foot">
          <p className="poster__fine" aria-hidden="true">
            {fine}
          </p>
          <p className="poster__marine">MARINE</p>
        </div>
      </article>
    </div>
  );
}
