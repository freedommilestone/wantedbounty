import { useEffect, useRef, useState, type CSSProperties } from "react";
import "./HomePreloader.css";

let shownThisVisit = false;
// Two posters share each lane, separated by half a complete fall cycle.
const layers = Array.from({ length: 10 }, (_, index) => {
  const lane = index % 5;
  const duration = 9 + lane * .6;
  return { left: 3 + lane * 20, duration, delay: -duration * (lane * .07 + (index >= 5 ? .5 : 0)) };
});

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
    let loadHandler: (() => void) | undefined;
    const loaded = new Promise<void>(resolve => {
      if (document.readyState === "complete") resolve();
      else { loadHandler = () => resolve(); window.addEventListener("load", loadHandler, { once: true }); }
    });
    const assets = [
      window.innerWidth <= 900 ? "/scene/home-mobile-plate.jpg" : "/scene/home-background-plate.jpg",
      "/textures/home-poster-paper.jpg", "/textures/button-parchment.png", "/brand/beri-monogram.png",
      ...["luffy", "zoro", "nami", "shanks", "robin"].map(name => `/portraits/home-${name}.jpg`),
    ].map(src => { const image = new Image(); image.src = src; return image.decode(); });
    let minimum: number;
    const delay = new Promise<void>(resolve => { minimum = window.setTimeout(resolve, 2000); });
    Promise.all([delay, loaded, document.fonts.ready, Promise.allSettled(assets)])
      .then(() => { if (!cancelled) setLeaving(true); });
    return () => {
      cancelled = true;
      clearTimeout(minimum);
      if (loadHandler) window.removeEventListener("load", loadHandler);
      panel?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setVisible(false), 450);
    return () => clearTimeout(timer);
  }, [leaving]);

  if (!visible) return null;
  return <dialog ref={dialog} className={`home-preloader ${leaving ? "home-preloader--leaving" : ""}`} aria-label="Entering Wanted Bounty" onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="home-preloader__sky" aria-hidden="true">
      {layers.map(({ left, duration, delay }, index) => {
        return <div className="home-preloader__fall" key={index} style={{ "--left": `${left}%`, "--duration": `${duration}s`, "--delay": `${delay}s` } as CSSProperties}>
          <div className="home-preloader__flutter"><div className="home-preloader__art" style={{ backgroundImage: `url(/scene/${index < 5 ? "flying-poster-sprites" : "flying-poster-crew"}.png)`, backgroundPosition: `${(index % 5) * 25}% center` }} /></div>
        </div>;
      })}
      {Array.from({length:12},(_,i)=><i key={i} className="home-preloader__scrap" style={{left:`${i * 9}%`,animationDelay:`${-i * .7}s`,animationDuration:`${5 + i % 4}s`}} />)}
    </div>
  </dialog>;
}
