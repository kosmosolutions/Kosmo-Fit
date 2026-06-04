interface RingProps {
  pct: number;
  color: string;
  size: number;
  stroke: number;
  trackOpacity?: number;
  /** Apple-style two-tone arc (hue brightens toward the leading cap). */
  gradient?: boolean;
}

// Lighten a #hex toward white by `amt` (0..1). Returns rgb(). Non-hex passes
// through unchanged so callers can still hand in rgb()/named colors safely.
function lighten(hex: string, amt = 0.4): string {
  if (!hex.startsWith("#")) return hex;
  const m = hex.slice(1);
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  if (n.length !== 6) return hex;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amt);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function Ring({
  pct,
  color,
  size,
  stroke,
  trackOpacity = 0.07,
  gradient = true,
}: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(Math.max(pct, 0), 1);
  // Deterministic id (SSR-safe): same color+stroke reuses one def, different
  // colors get distinct gradients. No counters → no hydration mismatch.
  const useGradient = gradient && color.startsWith("#");
  const gid = `ring-${color.replace(/[^a-zA-Z0-9]/g, "")}-${stroke}`;
  const arcStroke = useGradient ? `url(#${gid})` : color;
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", display: "block" }}
      aria-hidden
    >
      {useGradient && (
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={lighten(color)} />
          </linearGradient>
        </defs>
      )}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={`rgba(255,255,255,${trackOpacity})`}
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={arcStroke}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}
