// Diverging color scale for %-change heatmaps. Market convention (red=down,
// green=up) overrides the generic blue/red diverging pair here -- red/green
// is a domain-specific good/bad status read, not an arbitrary categorical
// choice, so we build the ramp from the fixed status palette instead:
// good #0ca30c <-> neutral gray #f0efec <-> critical #d03b3b.
const GOOD = [0x0c, 0xa3, 0x0c];
const NEUTRAL = [0xf0, 0xef, 0xec];
const CRITICAL = [0xd0, 0x3b, 0x3b];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mix(c1, c2, t) {
  return `rgb(${lerp(c1[0], c2[0], t)}, ${lerp(c1[1], c2[1], t)}, ${lerp(c1[2], c2[2], t)})`;
}

// pct in [-cap, +cap] maps to full saturation at the poles.
export function heatColor(pct, cap = 3) {
  const clamped = Math.max(-cap, Math.min(cap, pct ?? 0));
  const t = clamped / cap; // -1..1
  if (t >= 0) return mix(NEUTRAL, GOOD, t);
  return mix(NEUTRAL, CRITICAL, -t);
}

export function textColorFor(pct) {
  return Math.abs(pct ?? 0) > 1.2 ? "#ffffff" : "#0b0b0b";
}
