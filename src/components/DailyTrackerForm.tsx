"use client";

import { useState, useTransition } from "react";
import {
  Footprints,
  Bike,
  Dumbbell,
  Droplets,
  Moon,
  Scale,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { upsertDailyEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/cn";
import { CardioLogPopup } from "./CardioLogPopup";
import {
  WeightLogPopup,
  WaterLogPopup,
  StepsLogPopup,
  SleepLogPopup,
  NotesLogPopup,
} from "./MetricPopups";
import { formatWeight, formatWater } from "@/lib/units";
import { useUnitPref } from "@/lib/useUnitPref";
import type { WaterUnit, WeightUnit } from "@/lib/units";

interface Props {
  entryDate: string;
  bodyWeightLbs: number;
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

type Popup = "weight" | "steps" | "cardio" | "water" | "sleep" | "notes";

export function DailyTrackerForm({ entryDate, bodyWeightLbs, initial }: Props) {
  const [open, setOpen] = useState<Popup | null>(null);
  const [pending, start] = useTransition();
  // Optimistic local state for the two inline toggles. Numeric/text metrics
  // are owned by their popups, which write + revalidate.
  const [mood, setMood] = useState(initial.mood);
  const [done, setDone] = useState(initial.workout_completed);

  // Display units (popups own the editing units; cards mirror the choice).
  const [weightUnit] = useUnitPref<WeightUnit>("weight", "lb");
  const [waterUnit] = useUnitPref<WaterUnit>("water", "oz");

  function toggleDone() {
    const next = !done;
    setDone(next);
    start(async () => {
      await upsertDailyEntry({ entry_date: entryDate, workout_completed: next });
    });
  }

  function pickMood(m: NonNullable<typeof mood>) {
    const next = mood === m ? null : m;
    setMood(next);
    start(async () => {
      await upsertDailyEntry({ entry_date: entryDate, mood: next });
    });
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="label-tiny">Daily tracker</div>
          <div className="text-base font-extrabold text-chalk-50">Log today</div>
        </div>
        {pending && (
          <div className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk-300">
            Saving…
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          Icon={Scale}
          label="Weight"
          value={formatWeight(initial.weight, weightUnit)}
          unit={initial.weight == null ? "" : weightUnit}
          accent="text-accent-cyan"
          onClick={() => setOpen("weight")}
        />
        <MetricCard
          Icon={Footprints}
          label="Steps"
          value={initial.steps ? initial.steps.toLocaleString() : "—"}
          unit={initial.steps ? "steps" : ""}
          accent="text-accent-cyan"
          onClick={() => setOpen("steps")}
        />
        <MetricCard
          Icon={Bike}
          label="Cardio"
          value={
            initial.cardio_minutes || initial.cardio_calories
              ? `${initial.cardio_minutes}`
              : "—"
          }
          unit={
            initial.cardio_minutes || initial.cardio_calories
              ? `min · ${initial.cardio_calories} cal`
              : ""
          }
          accent="text-accent-amber"
          onClick={() => setOpen("cardio")}
        />
        <MetricCard
          Icon={Droplets}
          label="Water"
          value={initial.water_oz ? formatWater(initial.water_oz, waterUnit) : "—"}
          unit={initial.water_oz ? waterUnit : ""}
          accent="text-sky-300"
          onClick={() => setOpen("water")}
        />
        <MetricCard
          Icon={Moon}
          label="Sleep"
          value={initial.sleep_hours != null ? `${initial.sleep_hours}` : "—"}
          unit={initial.sleep_hours != null ? "hrs" : ""}
          accent="text-accent-violet"
          onClick={() => setOpen("sleep")}
        />
        <MetricCard
          Icon={StickyNote}
          label="Notes"
          value={initial.notes ? "Added" : "—"}
          unit=""
          accent="text-accent-amber"
          onClick={() => setOpen("notes")}
        />
      </div>

      {/* Workout completed toggle */}
      <button
        onClick={toggleDone}
        type="button"
        className={cn(
          "mt-3 flex w-full items-center justify-between rounded-xl border px-4 py-3 transition",
          done
            ? "border-accent-green/40 bg-accent-green/10"
            : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
        )}
      >
        <span className="flex items-center gap-2">
          <Dumbbell
            className={cn("h-4 w-4", done ? "text-accent-green" : "text-chalk-300")}
          />
          <span className="text-sm font-bold text-chalk-50">Workout completed</span>
        </span>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            done ? "bg-accent-green/20 text-accent-green" : "bg-white/5 text-chalk-300",
          )}
        >
          {done ? "Done" : "Tap if you trained"}
        </span>
      </button>

      {/* Mood */}
      <div className="mt-3">
        <div className="label-tiny mb-2">How did you feel?</div>
        <div className="grid grid-cols-4 gap-2">
          {(["great", "good", "meh", "bad"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pickMood(m)}
              className={cn(
                "rounded-xl border px-2 py-2 text-xs font-bold capitalize transition",
                mood === m
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

      {/* Popups */}
      <WeightLogPopup
        open={open === "weight"}
        onClose={() => setOpen(null)}
        entryDate={entryDate}
        initialLbs={initial.weight}
      />
      <StepsLogPopup
        open={open === "steps"}
        onClose={() => setOpen(null)}
        entryDate={entryDate}
        initialSteps={initial.steps}
      />
      <CardioLogPopup
        open={open === "cardio"}
        onClose={() => setOpen(null)}
        entryDate={entryDate}
        bodyWeightLbs={bodyWeightLbs}
        initialMinutes={initial.cardio_minutes}
        initialCalories={initial.cardio_calories}
      />
      <WaterLogPopup
        open={open === "water"}
        onClose={() => setOpen(null)}
        entryDate={entryDate}
        initialOz={initial.water_oz}
      />
      <SleepLogPopup
        open={open === "sleep"}
        onClose={() => setOpen(null)}
        entryDate={entryDate}
        initialHours={initial.sleep_hours}
      />
      <NotesLogPopup
        open={open === "notes"}
        onClose={() => setOpen(null)}
        entryDate={entryDate}
        initialNotes={initial.notes}
      />
    </div>
  );
}

function MetricCard({
  Icon,
  label,
  value,
  unit,
  accent,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-left transition hover:bg-white/[0.06]"
    >
      <span className="mb-1 flex items-center gap-1 text-chalk-400">
        <Icon className="h-3.5 w-3.5" />
        <span className="label-tiny">{label}</span>
      </span>
      <span className="flex items-baseline gap-1">
        <span className={cn("text-xl font-extrabold", accent)}>{value}</span>
        {unit && <span className="text-[10px] text-chalk-400">{unit}</span>}
      </span>
    </button>
  );
}
