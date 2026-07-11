import type { Lifestyle, Profile, WorkoutMode } from "./types";

export const LIFESTYLE: Record<
  Lifestyle,
  { label: string; desc: string; multiplier: number }
> = {
  desk:   { label: "Desk Job",  desc: "Mostly sitting",         multiplier: 1.2 },
  light:  { label: "Light",     desc: "Some walking",           multiplier: 1.3 },
  active: { label: "Active",    desc: "On feet most of day",    multiplier: 1.4 },
};

export const DAY_LABELS = [
  "Shoulders",
  "Back",
  "Chest",
  "Arms",
  "Legs",
  "Cardio",
] as const;

export const BURNS: Record<WorkoutMode, number[]> = {
  gym:  [340, 400, 395, 270, 530, 290],
  home: [320, 385, 375, 250, 510, 360],
};

/** Calories burned per minute of brisk walking for a body weight in lbs. */
export function walkingCalPerMin(weightLbs: number): number {
  // ~0.045 cal per minute per pound at 3.5 mph
  return weightLbs * 0.045;
}

/** Calories burned per step (rough but defensible). */
export function calPerStep(weightLbs: number): number {
  return weightLbs * 0.00045;
}

/** Average minutes from a free-form duration like "~55 min" or "25–30 min". */
function parseDurationMinutes(d?: string): number {
  if (!d) return 45;
  const nums = (d.match(/\d+/g) ?? []).map(Number);
  if (nums.length === 0) return 45;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * Estimate a session's calorie burn from its duration + focus. Used for
 * template days, which (unlike the hand-tuned original 6-day split) don't
 * carry per-day burn numbers. Rest days (no exercises) burn nothing.
 *
 * Rates are deliberately conservative and land in the same ballpark as the
 * legacy BURNS table (~7 cal/min strength, ~11 cal/min for intervals).
 */
export function estimateSessionBurn(day: {
  duration?: string;
  focus: string;
  exercises: unknown[];
}): number {
  if (!day.exercises || day.exercises.length === 0) return 0;
  const mins = parseDurationMinutes(day.duration);
  const f = day.focus.toLowerCase();
  const intervals = /hiit|sprint|interval|cardio/.test(f);
  const rate = intervals ? 11 : 7;
  return Math.round(mins * rate);
}

export interface Stats {
  bmr: number;
  lifeTDEE: number;
  dailyDeficit: number;
  weeklyLoss: number;
  aggressive: boolean;
  lbsToLose: number;
  burns: number[];
  dayTargets: number[];
  restTarget: number;
  avgWorkoutTarget: number;
  weeklyBurn: number;
  proteinG: number;
  proteinCal: number;
  workoutMacros: Macros;
  restMacros: Macros;
}

export interface Macros {
  fatG: number;
  fatCal: number;
  carbG: number;
  carbCal: number;
}

export interface MacroOverride {
  protein: number;
  carb: number;
  fat: number;
}

function macros(
  targetCal: number,
  proteinCal: number,
  override?: MacroOverride | null,
): Macros {
  if (override) {
    const fatG = Math.round((targetCal * (override.fat / 100)) / 9);
    const carbG = Math.round((targetCal * (override.carb / 100)) / 4);
    return { fatG, fatCal: fatG * 9, carbG, carbCal: carbG * 4 };
  }
  const fatG = Math.round((targetCal * 0.27) / 9);
  const fatCal = fatG * 9;
  const carbG = Math.round(Math.max(0, targetCal - proteinCal - fatCal) / 4);
  return { fatG, fatCal, carbG, carbCal: carbG * 4 };
}

export function calcStats(
  p: Pick<
    Profile,
    | "current_weight"
    | "goal_weight"
    | "height_ft"
    | "height_in"
    | "age"
    | "sex"
    | "lifestyle"
    | "weeks_to_goal"
  > &
    Partial<
      Pick<
        Profile,
        "macro_protein_pct" | "macro_carb_pct" | "macro_fat_pct"
      >
    >,
  mode: WorkoutMode,
): Stats {
  const kg = p.current_weight * 0.453592;
  const cm = (p.height_ft * 12 + p.height_in) * 2.54;
  // Mifflin-St Jeor
  const sexConstant = p.sex === "female" ? -161 : 5;
  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * p.age + sexConstant);

  const lifestyle = LIFESTYLE[p.lifestyle] ?? LIFESTYLE.desk;
  const lifeTDEE = Math.round(bmr * lifestyle.multiplier);

  const lbsToLose = Math.max(0, p.current_weight - p.goal_weight);
  const weeklyDeficit = (lbsToLose * 3500) / Math.max(1, p.weeks_to_goal);
  const dailyDeficit = Math.round(weeklyDeficit / 7);
  const weeklyLoss = +(weeklyDeficit / 3500).toFixed(1);
  // Aggressive when losing faster than ~1% of body weight per week (the
  // usual sustainable ceiling), or past the absolute 2 lb/wk / 1000 cal/day
  // marks. The old absolute-only rule never fired for lighter users.
  const aggressive =
    dailyDeficit > 1000 ||
    weeklyLoss > 2 ||
    weeklyLoss > p.current_weight * 0.01;

  const burns = BURNS[mode];
  const dayTargets = burns.map((b) =>
    Math.max(1400, lifeTDEE + b - dailyDeficit),
  );
  const restTarget = Math.max(1400, lifeTDEE - dailyDeficit);
  const avgWorkoutTarget = Math.round(
    dayTargets.reduce((a, b) => a + b, 0) / dayTargets.length,
  );
  const weeklyBurn = burns.reduce((s, b) => s + b, 0);

  const override =
    p.macro_protein_pct != null &&
    p.macro_carb_pct != null &&
    p.macro_fat_pct != null
      ? {
          protein: p.macro_protein_pct,
          carb: p.macro_carb_pct,
          fat: p.macro_fat_pct,
        }
      : null;

  // When the user overrides macros, protein follows the calorie split
  // for the workout target (the day they're most likely viewing). Without
  // an override, fall back to the 0.9 g/lb body-weight heuristic.
  const proteinG = override
    ? Math.round((avgWorkoutTarget * (override.protein / 100)) / 4)
    : Math.round(p.current_weight * 0.9);
  const proteinCal = proteinG * 4;

  return {
    bmr,
    lifeTDEE,
    dailyDeficit,
    weeklyLoss,
    aggressive,
    lbsToLose,
    burns,
    dayTargets,
    restTarget,
    avgWorkoutTarget,
    weeklyBurn,
    proteinG,
    proteinCal,
    workoutMacros: macros(avgWorkoutTarget, proteinCal, override),
    restMacros: macros(restTarget, proteinCal, override),
  };
}

/**
 * The user's effective calorie target for a given day. The "base" is the
 * deficit-only target (Life TDEE − daily deficit) shown by default. Earned
 * burn — completed workout + logged cardio — is added on top, so the target
 * only rises once the work is actually done.
 *
 * The 1400 floor is applied once, after earned burn, so this agrees with
 * `dayTargets` (which clamps the same way) even under aggressive deficits.
 */
export function dailyCalorieTarget(
  stats: Stats,
  workoutBurn: number,
  workoutCompleted: boolean,
  cardioCalories: number,
): number {
  const earned = workoutCompleted ? workoutBurn : 0;
  return Math.max(
    1400,
    stats.lifeTDEE - stats.dailyDeficit + earned + (cardioCalories || 0),
  );
}

/**
 * Recommend how to close a gap between actual intake/burn and the target.
 * Negative gap means user has eaten *more* than target — needs extra activity.
 */
export function closeTheGap(
  eatenCal: number,
  targetCal: number,
  burnedToday: number,
  weightLbs: number,
) {
  const net = eatenCal - burnedToday;
  const gap = net - targetCal;
  if (gap <= 0) {
    return {
      gap: 0,
      walkMinutes: 0,
      steps: 0,
      cardioMinutes: 0,
      status: "on-track" as const,
    };
  }
  const walkCalPerMin = walkingCalPerMin(weightLbs);
  const walkMinutes = Math.ceil(gap / walkCalPerMin);
  const steps = Math.ceil(gap / calPerStep(weightLbs));
  const cardioMinutes = Math.ceil(gap / (walkCalPerMin * 2.2)); // moderate cardio ~2.2× walking burn
  return {
    gap: Math.round(gap),
    walkMinutes,
    steps,
    cardioMinutes,
    status: "over" as const,
  };
}
