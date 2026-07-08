import { GYM_DAYS, HOME_DAYS } from "@/data/workouts";
import { getTemplate } from "@/data/workout-templates";
import { BURNS, estimateSessionBurn } from "./calc";
import type { BuiltDay } from "./workout-plan-types";
import type { WorkoutMode } from "./types";

export interface ResolvedPlanDay {
  /** Slot index within the active plan's own day layout, or -1 on rest days. */
  dayIndex: number;
  /** Visuals for the day, or null on rest days. */
  day: { focus: string; icon: string; color: string; duration: string } | null;
  /** Estimated session burn, creditable once the workout is completed. */
  burn: number;
}

const REST: ResolvedPlanDay = { dayIndex: -1, day: null, burn: 0 };

const WEEKDAY_BY_LABEL: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/**
 * JS getDay() index for a day's weekday label ("Mon", "Wed", …), or null for
 * unanchored labels (template rest fillers use "—"). Template and legacy days
 * declare which weekday they belong to via this label, so it — not a global
 * hard-coded week map — decides which calendar dates train.
 */
export function weekdayFromLabel(label: string): number | null {
  return WEEKDAY_BY_LABEL[label.slice(0, 3).toLowerCase()] ?? null;
}

/**
 * Resolve what a calendar date means under the user's active plan — which
 * training day it is (if any) and how much completing it earns. This is the
 * single source of truth shared by the overview, diet, and workout pages so
 * every screen prices the same day the same way.
 *
 * - Built plans carry their own weekday layout: match on the date's weekday.
 * - Templates map onto the legacy 6-slot week (Wed…Mon, Tue rest); slots with
 *   no exercises are rest days, and burns derive from duration + focus.
 * - The legacy/custom 6-day split keeps its hand-tuned positional BURNS.
 */
export function resolvePlanDay(opts: {
  date: Date;
  mode: WorkoutMode;
  /** The plan's base template when a saved plan is active, else the profile's. */
  activeTemplateId: string | null;
  /** A built plan's own day layout, when one is active. */
  builtDays: BuiltDay[] | null;
}): ResolvedPlanDay {
  const { date, mode, activeTemplateId, builtDays } = opts;

  if (builtDays) {
    const idx = builtDays.findIndex((bd) => bd.weekday === date.getDay());
    if (idx < 0) return REST;
    const bd = builtDays[idx];
    const day = {
      focus: bd.focus,
      icon: bd.icon,
      color: bd.color,
      duration: bd.duration,
    };
    return {
      dayIndex: idx,
      day,
      burn: estimateSessionBurn({
        duration: bd.duration,
        focus: bd.focus,
        // Built training days always seed exercises; a length-1 marker is
        // enough for the estimator's rest-day check.
        exercises: [0],
      }),
    };
  }

  const template =
    activeTemplateId && activeTemplateId !== "custom-6day"
      ? getTemplate(activeTemplateId)
      : null;
  const isLegacy = !template;
  const planDays = template
    ? template.days[mode]
    : mode === "gym"
      ? GYM_DAYS
      : HOME_DAYS;

  const slot = planDays.findIndex(
    (d) => weekdayFromLabel(d.weekday) === date.getDay(),
  );
  if (slot < 0) return REST;
  const td = planDays[slot];
  if (td.exercises.length === 0 || td.focus === "Rest") return REST;

  return {
    dayIndex: slot,
    day: {
      focus: td.focus,
      icon: td.icon,
      color: td.color,
      duration: td.duration,
    },
    burn: isLegacy ? (BURNS[mode][slot] ?? 0) : estimateSessionBurn(td),
  };
}
