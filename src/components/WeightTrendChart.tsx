import Link from "next/link";
import { TrendingDown, TrendingUp, Minus, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { fromISODate, toISODate, todayISO as localToday } from "@/lib/dates";
import { projectGoalEta, type GoalEta } from "@/lib/goalEta";
import type { WeightPoint } from "@/lib/actions/weight";

interface Props {
  points: WeightPoint[];
  currentWeight: number;
  goalWeight: number;
  /** How many days back from today the chart covers. */
  windowDays?: number;
  /**
   * The user's local "today" (YYYY-MM-DD). Server-rendered pages must pass
   * `localTodayISO()` — the server clock is UTC, so deriving today here
   * would shift the window for users far from UTC.
   */
  todayISO?: string;
  /**
   * The pace the user planned at onboarding (lbs/week). Enables the
   * goal-ETA footer: pass `stats.weeklyLoss`.
   */
  plannedWeeklyLoss?: number;
  /**
   * Where the footer's "Adjust plan" chip navigates (the plan-settings
   * screen). Omit on the profile page itself — the chip renders as a
   * static label there.
   */
  planHref?: string;
  className?: string;
}

interface DailyValue {
  date: string;
  weight: number;
  logged: boolean;
}

const W = 600; // SVG viewBox width
const H = 240; // SVG viewBox height
const PAD = { top: 24, right: 14, bottom: 32, left: 40 };

/**
 * Weight-trend chart with a one-point-per-day line. Days where the
 * user didn't log a weight carry forward the previous logged value
 * (or the starting weight if nothing has been logged yet). This keeps
 * the chart continuous and visually reminds the user when they've gone
 * quiet on logging — flat stretches stand out.
 */
export function WeightTrendChart({
  points,
  currentWeight,
  goalWeight,
  windowDays = 90,
  todayISO,
  plannedWeeklyLoss = 0,
  planHref,
  className,
}: Props) {
  const today = todayISO ?? localToday();
  const series = buildDailySeries(points, currentWeight, windowDays, today);
  const eta = projectGoalEta({
    points,
    currentWeight,
    goalWeight,
    plannedWeeklyLoss,
    todayISO: today,
  });

  // Value range — always include goal so the reference line stays in view.
  const allWeights = series
    .map((d) => d.weight)
    .concat(goalWeight)
    .filter((w) => Number.isFinite(w) && w > 0);

  const minVal = allWeights.length ? Math.min(...allWeights) : 0;
  const maxVal = allWeights.length ? Math.max(...allWeights) : 0;
  const pad = Math.max((maxVal - minVal) * 0.15, 2);
  const yMin = minVal - pad;
  const yMax = maxVal + pad;
  const ySpan = yMax - yMin || 1;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const xFor = (i: number) =>
    series.length <= 1
      ? PAD.left + innerW
      : PAD.left + (i / (series.length - 1)) * innerW;
  const yFor = (w: number) =>
    PAD.top + (1 - (w - yMin) / ySpan) * innerH;

  const pts = series.map((d, i) => ({ x: xFor(i), y: yFor(d.weight) }));
  const pathD = smoothPath(pts);
  const baseY = PAD.top + innerH;
  const areaD =
    pts.length > 0
      ? `${pathD} L ${pts[pts.length - 1].x} ${baseY} L ${pts[0].x} ${baseY} Z`
      : "";

  const goalY = Number.isFinite(goalWeight) ? yFor(goalWeight) : null;

  // Trend chip — first vs. last value in the rendered series.
  const delta =
    series.length >= 2
      ? series[series.length - 1].weight - series[0].weight
      : 0;
  const trend = delta < -0.1 ? "down" : delta > 0.1 ? "up" : "flat";
  const losing = currentWeight > goalWeight;
  const goodTrend = losing ? "down" : "up";

  const yTicks = niceTicks(yMin, yMax, 4);
  const xTicks = pickXTicks(series, 4);
  const latest = series[series.length - 1];
  const hasAnyLog = series.some((d) => d.logged);

  return (
    <div className={cn("card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="metric-label">Weight trend</div>
          <div className="mt-1 font-display text-[28px] font-black leading-none tracking-tightest text-white">
            {latest ? `${latest.weight.toFixed(1)}` : "—"}
            <span className="ml-1 text-[13px] font-semibold text-chalk-400">
              lb
            </span>
          </div>
          <div className="mt-1 text-[12px] font-medium text-chalk-400">
            Goal {goalWeight ? `${goalWeight.toFixed(0)} lb` : "—"}
            <span className="mx-1.5 text-chalk-500">·</span>
            Last {windowDays} days
          </div>
        </div>
        <TrendChip delta={delta} trend={trend} good={trend === goodTrend} />
      </div>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Weight history line chart"
        >
          <defs>
            <linearGradient id="weight-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0A84FF" stopOpacity="0.40" />
              <stop offset="55%" stopColor="#0A84FF" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#0A84FF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="weight-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0A84FF" />
              <stop offset="100%" stopColor="#64D2FF" />
            </linearGradient>
            <filter id="weight-glow" x="-20%" y="-40%" width="140%" height="200%">
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="4"
                floodColor="#0A84FF"
                floodOpacity="0.45"
              />
            </filter>
          </defs>

          {/* Y-axis gridlines + tick labels */}
          {yTicks.map((t) => {
            const y = yFor(t);
            return (
              <g key={`y-${t}`}>
                <line
                  x1={PAD.left}
                  x2={W - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="1"
                />
                <text
                  x={PAD.left - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-chalk-500"
                  style={{ font: "bold 10px ui-sans-serif, system-ui" }}
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* Goal weight reference line */}
          {goalY !== null && (
            <>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={goalY}
                y2={goalY}
                stroke="rgba(48,209,88,0.55)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <text
                x={W - PAD.right - 4}
                y={goalY - 6}
                textAnchor="end"
                className="fill-accent-green"
                style={{ font: "bold 11px ui-sans-serif, system-ui" }}
              >
                Goal {goalWeight.toFixed(0)}
              </text>
            </>
          )}

          {/* Area + line */}
          {series.length > 0 && (
            <>
              <path d={areaD} fill="url(#weight-area)" />
              <path
                d={pathD}
                fill="none"
                stroke="url(#weight-line)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#weight-glow)"
              />
              {/* Subtle markers for actually-logged days */}
              {series.map((d, i) =>
                d.logged && i !== series.length - 1 ? (
                  <circle
                    key={`log-${d.date}`}
                    cx={xFor(i)}
                    cy={yFor(d.weight)}
                    r="2"
                    fill="#0B1220"
                    stroke="#64D2FF"
                    strokeWidth="1.5"
                  />
                ) : null,
              )}
              {/* Latest-point highlight */}
              {latest && (
                <>
                  <circle
                    cx={xFor(series.length - 1)}
                    cy={yFor(latest.weight)}
                    r="7"
                    fill="#0A84FF"
                    fillOpacity="0.18"
                  />
                  <circle
                    cx={xFor(series.length - 1)}
                    cy={yFor(latest.weight)}
                    r="4"
                    fill="#0A84FF"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </>
              )}
            </>
          )}

          {/* X-axis tick labels */}
          {xTicks.map((t) => (
            <text
              key={`x-${t.index}`}
              x={xFor(t.index)}
              y={H - PAD.bottom + 16}
              textAnchor="middle"
              className="fill-chalk-500"
              style={{ font: "bold 10px ui-sans-serif, system-ui" }}
            >
              {t.label}
            </text>
          ))}
        </svg>

        {!hasAnyLog && (
          <div className="pointer-events-none absolute inset-0 grid place-items-end pb-9 pr-3">
            <div className="rounded-lg border border-white/10 bg-ink-950/70 px-2 py-1 text-[10px] font-bold text-chalk-300 backdrop-blur">
              Log a weight to start your trend
            </div>
          </div>
        )}
      </div>

      <GoalEtaFooter eta={eta} todayISO={today} planHref={planHref} />
    </div>
  );
}

/**
 * "When do I actually get there?" — projected from logged weights, anchored
 * at the last log so it only moves when new weights arrive; falls back to
 * the planned pace until enough logs exist.
 */
function GoalEtaFooter({
  eta,
  todayISO,
  planHref,
}: {
  eta: GoalEta;
  todayISO: string;
  planHref?: string;
}) {
  if (eta.kind === "none") return null;

  const tone =
    eta.kind === "reached"
      ? "text-accent-green"
      : eta.kind === "stalled"
        ? "text-chalk-300"
        : "text-white";

  let title: React.ReactNode;
  let sub: string;
  if (eta.kind === "reached") {
    title = "Goal reached";
    sub = "Time to set the next one";
  } else if (eta.kind === "stalled") {
    title = "No ETA at current trend";
    sub = "Recent logs aren't moving toward your goal";
  } else {
    title = (
      <>
        Goal by {formatEtaDate(eta.etaISO, todayISO)}
        <span className="font-semibold text-chalk-400">
          {" "}
          · ~{eta.daysFromToday} day{eta.daysFromToday === 1 ? "" : "s"}
        </span>
      </>
    );
    sub =
      eta.kind === "projected"
        ? `At your logged pace — ${eta.ratePerWeek.toFixed(1)} lb/wk`
        : "At your planned pace — log weights to track your real pace";
  }

  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-full",
            eta.kind === "stalled" ? "bg-white/[0.06]" : "bg-accent-green/15",
          )}
        >
          <Target
            className={cn(
              "h-4 w-4",
              eta.kind === "stalled" ? "text-chalk-400" : "text-accent-green",
            )}
          />
        </span>
        <div className="min-w-0">
          <div className={cn("text-[14px] font-bold leading-tight", tone)}>
            {title}
          </div>
          <div className="mt-0.5 text-[11px] font-medium text-chalk-400">
            {sub}
          </div>
        </div>
      </div>
      <PaceChip eta={eta} planHref={planHref} />
    </div>
  );
}

function PaceChip({ eta, planHref }: { eta: GoalEta; planHref?: string }) {
  let label: string;
  let tone: string;
  if (eta.kind === "projected") {
    if (eta.pace === "ahead") {
      label = "Ahead of plan";
      tone = "border-accent-green/30 bg-accent-green/10 text-accent-green";
    } else if (eta.pace === "behind") {
      label = "Behind plan";
      tone = "border-accent-orange/40 bg-accent-orange/10 text-accent-orange";
    } else {
      label = "On pace";
      tone = "border-accent-blue/30 bg-accent-blue/10 text-accent-blue";
    }
  } else if (eta.kind === "planned") {
    label = "Plan";
    tone = "border-white/10 bg-white/[0.04] text-chalk-300";
  } else if (eta.kind === "stalled") {
    label = "Stalled";
    tone = "border-white/10 bg-white/[0.04] text-chalk-300";
  } else {
    return null;
  }

  // Where the ETA reflects the plan (or the lack of one), the chip acts as
  // the entry point to change it — and only exists when there's somewhere
  // to go (the footer's sub-line already explains the state, so a static
  // "Plan" label adds nothing on the plan-settings screen itself). Pace
  // verdicts stay read-only labels.
  if (eta.kind === "planned" || eta.kind === "stalled") {
    if (!planHref) return null;
    return (
      <Link
        href={planHref}
        aria-label="Adjust your plan"
        className={cn(
          "inline-flex min-h-[32px] shrink-0 items-center gap-0.5 rounded-full border px-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-white/[0.08]",
          tone,
        )}
      >
        Adjust plan
        <ChevronRight className="h-3 w-3" />
      </Link>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
        tone,
      )}
    >
      {label}
    </div>
  );
}

function formatEtaDate(iso: string, todayISO: string): string {
  const d = fromISODate(iso);
  const sameYear = iso.slice(0, 4) === todayISO.slice(0, 4);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/**
 * Build one row per day across the window, carrying forward the last
 * known weight when the user didn't log. The starting fallback is the
 * profile's current weight, so the line is never empty.
 */
function buildDailySeries(
  points: WeightPoint[],
  fallbackWeight: number,
  windowDays: number,
  todayISODate: string,
): DailyValue[] {
  const byDate = new Map<string, number>();
  for (const p of points) byDate.set(p.date, p.weight);

  const today = fromISODate(todayISODate);
  const start = fromISODate(todayISODate);
  start.setDate(start.getDate() - (windowDays - 1));

  // Seed: most recent logged value BEFORE the window, if any. Lets the
  // line begin at the right level rather than the profile-set default.
  const startISO = toISODate(start);
  const earlierLogs = points.filter((p) => p.date < startISO);
  let last =
    earlierLogs.length > 0
      ? earlierLogs[earlierLogs.length - 1].weight
      : Number.isFinite(fallbackWeight) && fallbackWeight > 0
        ? fallbackWeight
        : NaN;

  const out: DailyValue[] = [];
  const d = new Date(start);
  while (d <= today) {
    const iso = toISODate(d);
    const logged = byDate.has(iso);
    if (logged) last = byDate.get(iso)!;
    out.push({
      date: iso,
      weight: Number.isFinite(last) ? last : fallbackWeight || 0,
      logged,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

/**
 * Catmull-Rom → cubic-bezier smoothing for a soft, Apple-Health-style
 * curve. Low tension keeps it faithful to the data without big overshoots.
 */
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  const t = 0.16;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) * t;
    const c1y = p1.y + (p2.y - p0.y) * t;
    const c2x = p2.x - (p3.x - p1.x) * t;
    const c2y = p2.y - (p3.y - p1.y) * t;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/**
 * Round y-axis tick values to whole numbers spaced evenly across
 * [min, max]. Returns 3–4 ticks suitable for a compact chart.
 */
function niceTicks(min: number, max: number, count: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const step = (max - min) / (count - 1);
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(Math.round(min + step * i));
  }
  // De-duplicate after rounding (e.g. when range is < count).
  return Array.from(new Set(ticks));
}

/** Evenly pick `count` x-axis tick positions and format their dates. */
function pickXTicks(
  series: DailyValue[],
  count: number,
): Array<{ index: number; label: string }> {
  if (series.length === 0) return [];
  if (series.length === 1)
    return [{ index: 0, label: formatShortDate(series[0].date) }];
  const ticks: Array<{ index: number; label: string }> = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.round((i / (count - 1)) * (series.length - 1));
    ticks.push({ index: idx, label: formatShortDate(series[idx].date) });
  }
  return ticks;
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
