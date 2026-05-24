import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WeightPoint } from "@/lib/actions/weight";

interface Props {
  points: WeightPoint[];
  currentWeight: number;
  goalWeight: number;
  /** Optional override for the visual range. Defaults to 90 days. */
  windowDays?: number;
  className?: string;
}

const W = 600; // SVG viewBox width
const H = 220; // SVG viewBox height
const PAD = { top: 24, right: 12, bottom: 28, left: 12 };

/**
 * Compact weight-trend chart: line + area fill, dashed goal-weight
 * reference line, current/goal labels on the right edge. Renders
 * inside a card; consumer supplies its own heading.
 */
export function WeightTrendChart({
  points,
  currentWeight,
  goalWeight,
  windowDays = 90,
  className,
}: Props) {
  const trimmed = trimToWindow(points, windowDays);
  const showEmpty = trimmed.length === 0;

  // Build the value range. Always include current + goal so the
  // reference line is visible even when the user hasn't logged in a
  // while.
  const allWeights = [
    ...trimmed.map((p) => p.weight),
    currentWeight,
    goalWeight,
  ].filter((w) => Number.isFinite(w) && w > 0);

  const minVal = allWeights.length ? Math.min(...allWeights) : 0;
  const maxVal = allWeights.length ? Math.max(...allWeights) : 0;
  const pad = Math.max((maxVal - minVal) * 0.15, 2);
  const yMin = minVal - pad;
  const yMax = maxVal + pad;
  const ySpan = yMax - yMin || 1;

  // X domain: oldest = left, newest = right. With a single point we
  // anchor it to the right edge so it reads as "latest".
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const xFor = (i: number) =>
    trimmed.length <= 1
      ? PAD.left + innerW
      : PAD.left + (i / (trimmed.length - 1)) * innerW;
  const yFor = (w: number) =>
    PAD.top + (1 - (w - yMin) / ySpan) * innerH;

  const pathD = trimmed
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.weight)}`)
    .join(" ");
  const areaD = trimmed.length
    ? `${pathD} L ${xFor(trimmed.length - 1)} ${PAD.top + innerH} L ${xFor(0)} ${PAD.top + innerH} Z`
    : "";

  const goalY = yFor(goalWeight);

  // Trend chip — delta from first logged to last logged in window.
  const delta =
    trimmed.length >= 2
      ? trimmed[trimmed.length - 1].weight - trimmed[0].weight
      : 0;
  const trend = delta < -0.1 ? "down" : delta > 0.1 ? "up" : "flat";
  const losing = currentWeight > goalWeight;
  // "Good" delta direction depends on whether the user is cutting or bulking.
  const goodTrend = losing ? "down" : "up";

  return (
    <div className={cn("card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label-tiny">Weight trend</div>
          <div className="text-base font-extrabold text-chalk-50">
            {currentWeight ? `${currentWeight.toFixed(1)} lbs` : "—"}
          </div>
          <div className="text-[11px] text-chalk-400">
            Goal {goalWeight ? `${goalWeight.toFixed(0)} lbs` : "—"}
            <span className="mx-1.5 text-chalk-600">·</span>
            Last {windowDays} days
          </div>
        </div>
        <TrendChip delta={delta} trend={trend} good={trend === goodTrend} />
      </div>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="block w-full"
          style={{ height: H }}
          role="img"
          aria-label="Weight history line chart"
        >
          <defs>
            <linearGradient id="weight-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Goal weight reference line */}
          {Number.isFinite(goalY) && (
            <>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={goalY}
                y2={goalY}
                stroke="rgba(124,92,255,0.45)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={W - PAD.right - 4}
                y={goalY - 6}
                textAnchor="end"
                className="fill-accent-violet"
                style={{
                  font: "bold 11px ui-sans-serif, system-ui",
                }}
              >
                Goal {goalWeight.toFixed(0)}
              </text>
            </>
          )}

          {!showEmpty && (
            <>
              <path d={areaD} fill="url(#weight-area)" />
              <path
                d={pathD}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Latest point dot */}
              {trimmed.length > 0 && (
                <>
                  <circle
                    cx={xFor(trimmed.length - 1)}
                    cy={yFor(trimmed[trimmed.length - 1].weight)}
                    r="6"
                    fill="#22d3ee"
                    fillOpacity="0.2"
                  />
                  <circle
                    cx={xFor(trimmed.length - 1)}
                    cy={yFor(trimmed[trimmed.length - 1].weight)}
                    r="3"
                    fill="#22d3ee"
                  />
                </>
              )}
            </>
          )}
        </svg>

        {showEmpty && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-2xl">📈</div>
              <div className="mt-1 text-xs font-bold text-chalk-300">
                No weight logged yet
              </div>
              <div className="mt-0.5 text-[11px] text-chalk-500">
                Log a daily weight to start your trend
              </div>
            </div>
          </div>
        )}
      </div>

      {/* X-axis date labels (first / last) */}
      {trimmed.length >= 2 && (
        <div className="-mt-1 flex justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-chalk-500">
          <span>{formatShortDate(trimmed[0].date)}</span>
          <span>{formatShortDate(trimmed[trimmed.length - 1].date)}</span>
        </div>
      )}
    </div>
  );
}

function trimToWindow(points: WeightPoint[], days: number): WeightPoint[] {
  if (!points.length) return [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffISO = cutoff.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= cutoffISO);
}

function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface TrendChipProps {
  delta: number;
  trend: "up" | "down" | "flat";
  good: boolean;
}

function TrendChip({ delta, trend, good }: TrendChipProps) {
  if (trend === "flat") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-chalk-300">
        <Minus className="h-3 w-3" />
        Steady
      </div>
    );
  }
  const Icon = trend === "down" ? TrendingDown : TrendingUp;
  const tone = good
    ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
    : "border-accent-rose/30 bg-accent-rose/10 text-accent-rose";
  const sign = delta > 0 ? "+" : "";
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
        tone,
      )}
    >
      <Icon className="h-3 w-3" />
      {sign}
      {delta.toFixed(1)} lbs
    </div>
  );
}
