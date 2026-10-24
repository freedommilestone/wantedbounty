import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./HomePreloader.css";

let shownThisVisit = false;
const layers = [
  [8, 330, 12, -3.8, 14, 0], [48, 290, 13, -5.6, -15, 0],
  [-8, 260, 14, -7, -22, 0], [32, 230, 13, -8.3, 17, 0],
  [63, 280, 14, -9, -18, 0], [46, 90, 12, -3, -24, 2],
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
        return <div className="home-preloader__fall" key={index} style={{ "--left": `${left}%`, "--width": `${width}px`, "--duration": `${duration}s`, "--delay": `${delay}s`, "--angle": `${angle}deg`, "--blur": `${blur}px` } as CSSProperties}>
          <div className="home-preloader__flutter"><div className="home-preloader__art" style={{ backgroundPosition: `${(index % 5) * 25}% center` }} /></div>
        </div>;
      })}
      {Array.from({length:12},(_,i)=><i key={i} className="home-preloader__scrap" style={{left:`${i * 9}%`,animationDelay:`${-i * .7}s`,animationDuration:`${5 + i % 4}s`}} />)}
    </div>
  </dialog>;
}
