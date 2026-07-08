import { GYM_DAYS, HOME_DAYS } from "@/data/workouts";
import { getTemplate } from "@/data/workout-templates";
import { BURNS, dayIndexForDate, estimateSessionBurn } from "./calc";
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

  const slot = dayIndexForDate(date);
  if (slot < 0) return REST;

  const template =
    activeTemplateId && activeTemplateId !== "custom-6day"
      ? getTemplate(activeTemplateId)
      : null;

  if (template) {
    const td = template.days[mode][slot];
    if (!td || td.exercises.length === 0 || td.focus === "Rest") return REST;
    return {
      dayIndex: slot,
      day: {
        focus: td.focus,
        icon: td.icon,
        color: td.color,
        duration: td.duration,
      },
      burn: estimateSessionBurn(td),
    };
  }

  const legacy = (mode === "gym" ? GYM_DAYS : HOME_DAYS)[slot];
  if (!legacy) return REST;
  return {
    dayIndex: slot,
    day: {
      focus: legacy.focus,
      icon: legacy.icon,
      color: legacy.color,
      duration: legacy.duration,
    },
    burn: BURNS[mode][slot] ?? 0,
  };
}
