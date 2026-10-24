import { useEffect, useRef, useState } from "react";
import "./HomePreloader.css";

let shownThisVisit = false;
const layers = Array.from({ length: 10 }, (_, index) => index);

export function HomePreloader() {
  const [visible, setVisible] = useState(!shownThisVisit);
  const [leaving, setLeaving] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const dismiss = () => setLeaving(true);

  useEffect(() => {
    if (!visible) return;
    const elements = Array.from(dialog.current!.querySelectorAll<HTMLElement>(".home-preloader__fall"));
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const random = (min: number, max: number) => min + Math.random() * (max - min);
    type Particle = { x: number; y: number; width: number; radius: number; angle: number; phase: number; drift: number; near: boolean };
    let particles: Particle[] = [];
    let width = window.innerWidth, height = window.innerHeight;
    const clear = (x: number, y: number, radius: number, ignore = -1) => particles.every((p, i) => i === ignore || Math.hypot(x - p.x, y - p.y) > radius + p.radius + 10);
    const reset = () => {
      width = window.innerWidth; height = window.innerHeight; particles = [];
      elements.forEach((element, index) => {
        const near = index < 2;
        const distant = index >= 5;
        const size = (near ? random(.44, .56) : distant ? random(.07, .13) : random(.23, .32)) * Math.min(width, 950);
        const radius = size * .94;
        let x = 0, y = 0;
        for (let attempt = 0; attempt < 600; attempt++) {
          x = near ? (index === 0 ? radius * .65 : width - radius * .65) : random(radius * .7, width - radius * .7);
          y = random(near ? 0 : -height * .4, height);
          if (clear(x, y, radius)) break;
          if (attempt === 599) y = -height - index * radius * 3;
        }
        particles.push({ x, y, width: size, radius, angle: random(-28, 28), phase: random(0, Math.PI * 2), drift: random(5, 16), near });
        element.style.width = `${size}px`;
        element.dataset.depth = near ? "near" : distant ? "far" : "middle";
        element.style.zIndex = near ? "3" : distant ? "1" : "2";
        element.style.opacity = "1";
        element.style.filter = "drop-shadow(3px 9px 7px #50301638)";
      });
    };
    reset();
    let frame = 0, previous = performance.now(), elapsed = 0;
    const tick = (now: number) => {
      const dt = Math.min((now - previous) / 1000, .05); previous = now; elapsed += dt;
      // Shared downward velocity preserves vertical separation; lateral drift is collision checked.
      particles.forEach(p => { if (!reduced) p.y += dt * Math.max(45, height * .075); });
      particles.forEach((p, index) => {
        if (!reduced) {
          const nextX = p.x + Math.sin(elapsed * .7 + p.phase) * p.drift * dt;
          if (nextX > p.radius * .5 && nextX < width - p.radius * .5 && clear(nextX, p.y, p.radius, index)) p.x = nextX;
          if (p.y - p.radius > height) {
            for (let attempt = 0; attempt < 60; attempt++) {
              const x = p.near ? (index === 0 ? p.radius * .65 : width - p.radius * .65) : random(p.radius * .7, width - p.radius * .7), y = -p.radius - random(5, height * .3);
              if (clear(x, y, p.radius, index)) { p.x = x; p.y = y; p.angle = random(-28, 28); break; }
            }
          }
        }
        const angle = p.angle + (reduced ? 0 : Math.sin(elapsed + p.phase) * 6);
        elements[index].style.transform = `translate3d(${p.x - p.width / 2}px,${p.y - p.width * .75}px,0) rotate(${angle}deg)`;
      });
      if (!reduced) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", reset);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", reset); };
  }, [visible]);

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
      {layers.map((index) => {
        return <div className="home-preloader__fall" key={index}>
          <div className="home-preloader__flutter"><div className="home-preloader__art" style={{ backgroundImage: `url(/scene/${index < 5 ? "flying-poster-sprites" : "flying-poster-crew"}.png)`, backgroundPosition: `${(index % 5) * 25}% center` }} /></div>
        </div>;
      })}
      {Array.from({length:12},(_,i)=><i key={i} className="home-preloader__scrap" style={{left:`${i * 9}%`,animationDelay:`${-i * .7}s`,animationDuration:`${5 + i % 4}s`}} />)}
    </div>
  </dialog>;
}
