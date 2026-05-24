"use client";

import { useTransition } from "react";
import { Check, CircleDashed, Loader2 } from "lucide-react";
import { upsertDailyEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/cn";
import type { WorkoutMode } from "@/lib/types";

interface Props {
  entryDate: string;
  completed: boolean;
  dayIndex: number;
  mode: WorkoutMode;
  color: string;
}

/**
 * Toggle pill that flips today's `workout_completed` flag — the same
 * field the overview page's "Workout completed" toggle writes. Pairs
 * with the SessionTimer so the user can mark the session done without
 * leaving the workout tab.
 *
 * Persists `workout_day_index` and `workout_mode` alongside the flag so
 * the overview can later show *which* day was completed.
 */
export function MarkCompleteToggle({
  entryDate,
  completed,
  dayIndex,
  mode,
  color,
}: Props) {
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      await upsertDailyEntry({
        entry_date: entryDate,
        workout_completed: !completed,
        workout_day_index: !completed ? dayIndex : null,
        workout_mode: !completed ? mode : null,
      });
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={completed}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-extrabold transition disabled:opacity-60",
        completed
          ? "border-accent-green/40 bg-accent-green/10 text-accent-green hover:bg-accent-green/15"
          : "text-ink-950 hover:brightness-110",
      )}
      style={
        completed
          ? undefined
          : { background: color, borderColor: color }
      }
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : completed ? (
        <Check className="h-4 w-4" />
      ) : (
        <CircleDashed className="h-4 w-4" />
      )}
      {completed ? "Completed · tap to undo" : "Mark workout complete"}
    </button>
  );
}
