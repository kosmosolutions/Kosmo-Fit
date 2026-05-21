"use client";

import { useState, useTransition } from "react";
import { Footprints, Bike, Dumbbell, Droplets, Moon, Scale } from "lucide-react";
import { upsertDailyEntry, type DailyPatch } from "@/lib/actions/entries";
import { cn } from "@/lib/cn";

interface Props {
  entryDate: string;
  initial: {
    weight: number | null;
    steps: number;
    cardio_minutes: number;
    cardio_calories: number;
    workout_completed: boolean;
    water_oz: number;
    sleep_hours: number | null;
    mood: "great" | "good" | "meh" | "bad" | null;
    notes: string | null;
  };
}

export function DailyTrackerForm({ entryDate, initial }: Props) {
  const [pending, start] = useTransition();
  const [state, setState] = useState(initial);
  const [saved, setSaved] = useState(false);

  function save(patch: Partial<typeof state>) {
    const next = { ...state, ...patch };
    setState(next);
    start(async () => {
      const payload: DailyPatch = {
        entry_date: entryDate,
        weight: next.weight,
        steps: next.steps,
        cardio_minutes: next.cardio_minutes,
        cardio_calories: next.cardio_calories,
        workout_completed: next.workout_completed,
        water_oz: next.water_oz,
        sleep_hours: next.sleep_hours,
        mood: next.mood,
        notes: next.notes,
      };
      await upsertDailyEntry(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 1200);
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-tiny">Daily tracker</div>
          <div className="text-base font-extrabold text-chalk-50">
            Log today
          </div>
        </div>
        <div
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition",
            saved
              ? "bg-accent-green/15 text-accent-green"
              : pending
                ? "bg-white/10 text-chalk-300"
                : "bg-transparent text-chalk-500",
          )}
        >
          {saved ? "Saved" : pending ? "Saving…" : "Auto-saved"}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field
          Icon={Scale}
          label="Weight"
          unit="lbs"
          value={state.weight ?? ""}
          step={0.1}
          onCommit={(v) =>
            save({ weight: v === "" ? null : parseFloat(v) || null })
          }
          color="text-chalk-50"
        />
        <Field
          Icon={Footprints}
          label="Steps"
          unit="steps"
          value={state.steps}
          step={100}
          onCommit={(v) => save({ steps: parseInt(v || "0", 10) || 0 })}
          color="text-accent-cyan"
        />
        <Field
          Icon={Bike}
          label="Cardio"
          unit="min"
          value={state.cardio_minutes}
          onCommit={(v) =>
            save({ cardio_minutes: parseInt(v || "0", 10) || 0 })
          }
          color="text-accent-amber"
        />
        <Field
          Icon={Bike}
          label="Cardio burn"
          unit="cal"
          value={state.cardio_calories}
          step={10}
          onCommit={(v) =>
            save({ cardio_calories: parseInt(v || "0", 10) || 0 })
          }
          color="text-accent-amber"
        />
        <Field
          Icon={Droplets}
          label="Water"
          unit="oz"
          value={state.water_oz}
          step={4}
          onCommit={(v) => save({ water_oz: parseInt(v || "0", 10) || 0 })}
          color="text-sky-300"
        />
        <Field
          Icon={Moon}
          label="Sleep"
          unit="hrs"
          value={state.sleep_hours ?? ""}
          step={0.25}
          onCommit={(v) =>
            save({ sleep_hours: v === "" ? null : parseFloat(v) || null })
          }
          color="text-accent-violet"
        />
      </div>

      <button
        onClick={() => save({ workout_completed: !state.workout_completed })}
        type="button"
        className={cn(
          "mt-3 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition",
          state.workout_completed
            ? "border-accent-green/40 bg-accent-green/10"
            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
        )}
      >
        <span className="flex items-center gap-2">
          <Dumbbell
            className={cn(
              "h-4 w-4",
              state.workout_completed
                ? "text-accent-green"
                : "text-chalk-300",
            )}
          />
          <span className="text-sm font-bold text-chalk-50">
            Workout completed
          </span>
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            state.workout_completed
              ? "bg-accent-green/20 text-accent-green"
              : "bg-white/5 text-chalk-300",
          )}
        >
          {state.workout_completed ? "Done" : "Tap if you trained"}
        </span>
      </button>

      <div className="mt-3">
        <div className="label-tiny mb-2">How did you feel?</div>
        <div className="grid grid-cols-4 gap-2">
          {(["great", "good", "meh", "bad"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => save({ mood: state.mood === m ? null : m })}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs font-bold capitalize transition",
                state.mood === m
                  ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan"
                  : "border-white/10 bg-white/[0.03] text-chalk-300 hover:bg-white/[0.06]",
              )}
            >
              {m === "great" ? "🔥 " : m === "good" ? "🙂 " : m === "meh" ? "😐 " : "😩 "}
              {m}
            </button>
          ))}
        </div>
      </div>

      <textarea
        defaultValue={state.notes ?? ""}
        placeholder="Notes about today…"
        rows={2}
        onBlur={(e) => save({ notes: e.currentTarget.value || null })}
        className="field mt-3 resize-none"
      />
    </div>
  );
}

function Field({
  Icon,
  label,
  unit,
  value,
  step = 1,
  onCommit,
  color,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  unit: string;
  value: number | string;
  step?: number;
  onCommit: (raw: string) => void;
  color?: string;
}) {
  const [local, setLocal] = useState<string>(String(value ?? ""));
  return (
    <label className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
      <span className="mb-1 flex items-center gap-1 text-chalk-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="label-tiny">{label}</span>
      </span>
      <span className="flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={local}
          step={step}
          onChange={(e) => setLocal(e.target.value)}
          onBlur={() => onCommit(local)}
          className={cn(
            "w-20 border-none bg-transparent p-0 text-xl font-extrabold outline-none",
            color ?? "text-chalk-50",
          )}
        />
        <span className="text-[10px] text-chalk-400">{unit}</span>
      </span>
    </label>
  );
}

