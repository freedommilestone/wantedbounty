function seeded(seed: number) {
  let state = seed % 2147483647;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

/** Clip-path with ragged top and/or bottom edges for full-width paper strips. Depths are in px. */
export function tornEdges(seed: number, { top = 0, bottom = 0, steps = 64 } = {}) {
  const next = seeded(seed);
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = ((i / steps) * 100).toFixed(2);
    points.push(top ? `${x}% ${(next() * top).toFixed(1)}px` : `${x}% 0`);
  }
  for (let i = steps; i >= 0; i--) {
    const x = ((i / steps) * 100).toFixed(2);
    points.push(bottom ? `${x}% calc(100% - ${(next() * bottom).toFixed(1)}px)` : `${x}% 100%`);
  }
  return `polygon(${points.join(", ")})`;
}

/** Clip-path with ragged edges on all four sides. Depth is a percentage of each side. */
export function tornPaper(seed: number, steps = 14, depth = 1.8) {
  const next = seeded(seed);
  const jitter = () => next() * depth;
  const pct = (value: number) => `${value.toFixed(2)}%`;
  const points: string[] = [];
  for (let i = 0; i < steps; i++) points.push(`${pct((i / steps) * 100)} ${pct(jitter())}`);
  for (let i = 0; i < steps; i++) points.push(`${pct(100 - jitter())} ${pct((i / steps) * 100)}`);
  for (let i = steps; i > 0; i--) points.push(`${pct((i / steps) * 100)} ${pct(100 - jitter())}`);
  for (let i = steps; i > 0; i--) points.push(`${pct(jitter())} ${pct((i / steps) * 100)}`);
  return `polygon(${points.join(", ")})`;
}
