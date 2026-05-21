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

function macros(targetCal: number, proteinCal: number): Macros {
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
  const aggressive = dailyDeficit > 1000 || weeklyLoss > 2;

  const burns = BURNS[mode];
  const dayTargets = burns.map((b) =>
    Math.max(1400, lifeTDEE + b - dailyDeficit),
  );
  const restTarget = Math.max(1400, lifeTDEE - dailyDeficit);
  const avgWorkoutTarget = Math.round(
    dayTargets.reduce((a, b) => a + b, 0) / dayTargets.length,
  );
  const weeklyBurn = burns.reduce((s, b) => s + b, 0);

  const proteinG = Math.round(p.current_weight * 0.9);
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
    workoutMacros: macros(avgWorkoutTarget, proteinCal),
    restMacros: macros(restTarget, proteinCal),
  };
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

/** Map JS Date day-of-week to the workout day index (0..5) or -1 for rest. */
export function dayIndexForDate(d: Date): number {
  // Existing app: Day 1=Wed, 2=Thu, 3=Fri, 4=Sat, 5=Sun, 6=Mon. Tuesday=rest.
  // getDay(): Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
  const map: Record<number, number> = {
    3: 0, // Wed
    4: 1, // Thu
    5: 2, // Fri
    6: 3, // Sat
    0: 4, // Sun
    1: 5, // Mon
    2: -1, // Tue = rest
  };
  return map[d.getDay()] ?? -1;
}
