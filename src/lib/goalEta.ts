import { fromISODate, toISODate } from "./dates";
import type { WeightPoint } from "./actions/weight";

/**
 * Projected arrival at the goal weight.
 *
 * - "projected": derived from the user's REAL logged-weight trend. Anchored
 *   at the last logged weight/date, so it only moves when a new weight is
 *   logged — going quiet doesn't silently push the date around.
 * - "planned": not enough logs yet; falls back to the pace the user chose
 *   at onboarding (weeks-to-goal), anchored at today.
 * - "stalled": recent logs aren't moving toward the goal (flat, reversing,
 *   or too slow to arrive within two years).
 * - "reached": last logged weight is at or past the goal.
 * - "none": no usable goal (e.g. maintain, or missing weights).
 */
export type GoalEta =
  | { kind: "reached" }
  | {
      kind: "projected";
      etaISO: string;
      daysFromToday: number;
      /** Actual progress pace, lbs per week toward the goal (positive). */
      ratePerWeek: number;
      pace: "ahead" | "on-pace" | "behind";
    }
  | { kind: "planned"; etaISO: string; daysFromToday: number }
  | { kind: "stalled" }
  | { kind: "none" };

const TREND_WINDOW_DAYS = 30;
const MIN_SPAN_DAYS = 7;
const MIN_LOGS = 3;
const MAX_ETA_DAYS = 730;
/** Below ~0.05 lb/week the "trend" is scale noise, not progress. */
const MIN_RATE_PER_DAY = 0.007;

function daysBetween(aISO: string, bISO: string): number {
  return Math.round(
    (fromISODate(bISO).getTime() - fromISODate(aISO).getTime()) / 86_400_000,
  );
}

function addDays(iso: string, days: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Least-squares slope in lbs/day over (dayOffset, weight) samples. */
function trendSlope(samples: Array<{ x: number; y: number }>): number {
  const n = samples.length;
  const mx = samples.reduce((s, p) => s + p.x, 0) / n;
  const my = samples.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of samples) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) * (p.x - mx);
  }
  return den === 0 ? 0 : num / den;
}

export function projectGoalEta(opts: {
  /** Logged weights, oldest → newest (as returned by getWeightHistory). */
  points: WeightPoint[];
  /** Profile weight — anchor fallback when nothing is logged yet. */
  currentWeight: number;
  goalWeight: number;
  /** Pace the user planned at onboarding, lbs/week (0 disables the fallback). */
  plannedWeeklyLoss: number;
  todayISO: string;
}): GoalEta {
  const { points, currentWeight, goalWeight, plannedWeeklyLoss, todayISO } =
    opts;

  if (!(goalWeight > 0)) return { kind: "none" };

  const last = points.length > 0 ? points[points.length - 1] : null;
  const anchorWeight = last?.weight ?? currentWeight;
  const anchorISO = last?.date ?? todayISO;
  if (!(anchorWeight > 0)) return { kind: "none" };

  const losing = goalWeight < anchorWeight;
  const toGo = Math.abs(anchorWeight - goalWeight);
  if (toGo < 0.05) return { kind: "reached" };

  // Trend over the window ENDING AT THE LAST LOG — not at today — so the
  // projection freezes in place until the user logs again.
  const windowStart = addDays(anchorISO, -(TREND_WINDOW_DAYS - 1));
  const recent = points.filter((p) => p.date >= windowStart);
  const span =
    recent.length >= 2 ? daysBetween(recent[0].date, anchorISO) : 0;

  if (recent.length >= MIN_LOGS && span >= MIN_SPAN_DAYS) {
    const samples = recent.map((p) => ({
      x: daysBetween(recent[0].date, p.date),
      y: p.weight,
    }));
    const slope = trendSlope(samples);
    // lbs/day of progress TOWARD the goal, regardless of cut vs bulk.
    const progressRate = losing ? -slope : slope;

    if (progressRate < MIN_RATE_PER_DAY) return { kind: "stalled" };

    const daysLeft = Math.ceil(toGo / progressRate);
    if (daysLeft > MAX_ETA_DAYS) return { kind: "stalled" };

    const etaISO = addDays(anchorISO, daysLeft);
    const ratePerWeek = progressRate * 7;
    const pace =
      plannedWeeklyLoss > 0
        ? ratePerWeek >= plannedWeeklyLoss * 1.15
          ? "ahead"
          : ratePerWeek <= plannedWeeklyLoss * 0.85
            ? "behind"
            : "on-pace"
        : "on-pace";

    return {
      kind: "projected",
      etaISO,
      daysFromToday: Math.max(0, daysBetween(todayISO, etaISO)),
      ratePerWeek,
      pace,
    };
  }

  // Not enough logged data yet — show the plan's own pace.
  if (plannedWeeklyLoss > 0) {
    const daysLeft = Math.ceil(toGo / (plannedWeeklyLoss / 7));
    if (daysLeft <= MAX_ETA_DAYS) {
      return {
        kind: "planned",
        etaISO: addDays(todayISO, daysLeft),
        daysFromToday: daysLeft,
      };
    }
  }
  return { kind: "none" };
}
