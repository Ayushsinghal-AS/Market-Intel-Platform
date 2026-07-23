// Diverging color scale for %-change heatmaps. Market convention (red=down,
// green=up) overrides the generic blue/red diverging pair here -- red/green
// is a domain-specific good/bad status read, not an arbitrary categorical
// choice, so we build the ramp from the fixed status palette instead:
// good #10B981 <-> neutral <-> critical #EF4444.
const GOOD = [0x10, 0xb9, 0x81];
const CRITICAL = [0xef, 0x44, 0x44];
const NEUTRAL_LIGHT = [0xf0, 0xef, 0xec];
const NEUTRAL_DARK = [0x1e, 0x29, 0x3b];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function mix(c1, c2, t) {
  return `rgb(${lerp(c1[0], c2[0], t)}, ${lerp(c1[1], c2[1], t)}, ${lerp(c1[2], c2[2], t)})`;
}

// pct in [-cap, +cap] maps to full saturation at the poles.
export function heatColor(pct, isDark = false, cap = 3) {
  const neutral = isDark ? NEUTRAL_DARK : NEUTRAL_LIGHT;
  const clamped = Math.max(-cap, Math.min(cap, pct ?? 0));
  const t = clamped / cap; // -1..1
  if (t >= 0) return mix(neutral, GOOD, t);
  return mix(neutral, CRITICAL, -t);
}

export function textColorFor(pct, isDark = false) {
  const strong = Math.abs(pct ?? 0) > 1.2;
  if (!strong) return isDark ? "#e5e7eb" : "#0b0b0b";
  return "#ffffff";
}
