import { useEffect, useRef, useState, type CSSProperties } from "react";
import { WantedPoster } from "./WantedPoster";
import "./HomePreloader.css";

let shownThisVisit = false;
const posters = [
  ["Monkey D. Luffy", "1,500,000,000", "luffy"],
  ["Roronoa Zoro", "1,111,000,000", "zoro"],
  ["Nami", "366,000,000", "nami"],
  ["Shanks", "4,048,900,000", "shanks"],
  ["Nico Robin", "1,000,000,000", "robin"],
];
const layers = [
  [15, 240, 8, -2.1, -19, 0], [68, 210, 9, -4.7, 18, 0],
  [33, 185, 10, -6.7, 24, 0], [78, 150, 11, -8.5, -25, 1],
  [2, 280, 7, -4.4, 28, 3], [46, 90, 12, -3, -24, 2],
  [90, 300, 7.5, -1.2, -18, 4], [28, 80, 13, -10, 30, 2],
  [57, 135, 10, -8, -15, 1], [5, 100, 12, -1, 20, 2],
];

export function HomePreloader() {
  const [visible, setVisible] = useState(!shownThisVisit);
  const [leaving, setLeaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dismiss = () => setLeaving(true);

  useEffect(() => {
    if (!visible) return;
    shownThisVisit = true;
    const panel = dialog.current;
    panel?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minimum = window.setTimeout(() => {
      const scenery = new Image();
      scenery.src = window.innerWidth <= 900 ? "/scene/home-mobile-plate.jpg" : "/scene/home-background-plate.jpg";
      scenery.decode().catch(() => {}).finally(() => { if (!cancelled) setLeaving(true); });
    }, reduced ? 300 : 3000);
    const maximum = window.setTimeout(dismiss, 5500);
    return () => { cancelled = true; clearTimeout(minimum); clearTimeout(maximum); panel?.close(); document.body.style.overflow = previousOverflow; };
  }, [visible]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setVisible(false), 450);
    return () => clearTimeout(timer);
  }, [leaving]);

  if (!visible) return null;
  return <dialog ref={dialog} className={`home-preloader ${leaving ? "home-preloader--leaving" : ""}`} aria-label="Entering Wanted Bounty" onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="home-preloader__sky" aria-hidden="true">
      {layers.map(([left, width, duration, delay, angle, blur], index) => {
        const [name, bounty, portrait] = posters[index % posters.length];
        return <div className="home-preloader__fall" key={index} style={{ "--left": `${left}%`, "--width": `${width}px`, "--duration": `${duration}s`, "--delay": `${delay}s`, "--angle": `${angle}deg`, "--blur": `${blur}px` } as CSSProperties}>
          <div className="home-preloader__flutter"><WantedPoster name={name} bounty={bounty} portrait={`/portraits/home-${portrait}.jpg`} seed={index + 20} /></div>
        </div>;
      })}
      {Array.from({length:12},(_,i)=><i key={i} className="home-preloader__scrap" style={{left:`${i * 9}%`,animationDelay:`${-i * .7}s`,animationDuration:`${5 + i % 4}s`}} />)}
    </div>
    <div className="home-preloader__status"><span role="status">Setting sail…</span><button type="button" onClick={dismiss} autoFocus>Enter site →</button></div>
  </dialog>;
}
