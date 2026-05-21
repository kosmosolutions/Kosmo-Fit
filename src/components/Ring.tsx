interface RingProps {
  pct: number;
  color: string;
  size: number;
  stroke: number;
  trackOpacity?: number;
}

export function Ring({ pct, color, size, stroke, trackOpacity = 0.07 }: RingProps) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(Math.max(pct, 0), 1);
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", display: "block" }}
      aria-hidden
    >
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
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}
