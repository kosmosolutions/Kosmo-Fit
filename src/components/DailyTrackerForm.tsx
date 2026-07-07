"use client";

import { useState, useTransition } from "react";
import {
  Footprints,
  Bike,
  Dumbbell,
  Droplets,
  Flame,
  Frown,
  Meh,
  Moon,
  Scale,
  Smile,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { upsertDailyEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/cn";
import { CardioLogPopup } from "./CardioLogPopup";
import { ImageUploadButton } from "./ImageUploadButton";
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
  isToday?: boolean;
  bodyWeightLbs: number;
  /** Daily step goal — renders a progress meter on the steps card. */
  stepGoal?: number;
  initial: {
    weight: number | null;
    steps: number;
    cardio_minutes: number;
    cardio_calories: number;
    cardio_type: string | null;
    workout_completed: boolean;
    water_oz: number;
    sleep_hours: number | null;
    mood: "great" | "good" | "meh" | "bad" | null;
    notes: string | null;
    photo_url: string | null;
  };
}

type Popup = "weight" | "steps" | "cardio" | "water" | "sleep" | "notes";

export function DailyTrackerForm({
  entryDate,
  isToday = true,
  bodyWeightLbs,
  stepGoal,
  initial,
}: Props) {
  const [open, setOpen] = useState<Popup | null>(null);
  const [pending, start] = useTransition();
  const [mood, setMood] = useState(initial.mood);
  const [done, setDone] = useState(initial.workout_completed);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial.photo_url);

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
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="metric-label">Daily tracker</div>
          <div className="mt-0.5 text-[20px] font-bold tracking-tight text-white">
            {isToday
              ? "Log today"
              : `Log ${new Date(`${entryDate}T00:00:00`).toLocaleDateString(
                  undefined,
                  { weekday: "long", month: "short", day: "numeric" },
                )}`}
          </div>
        </div>
        {pending && (
          <div className="rounded-full bg-white/[0.10] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-chalk-200">
            Saving…
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <MetricCard
          Icon={Scale}
          label="Weight"
          value={formatWeight(initial.weight, weightUnit)}
          unit={initial.weight == null ? "" : weightUnit}
          accent="#30D158"
          onClick={() => setOpen("weight")}
        />
        <MetricCard
          Icon={Footprints}
          label="Steps"
          value={initial.steps ? initial.steps.toLocaleString() : "—"}
          unit={
            initial.steps && stepGoal
              ? `/ ${stepGoal.toLocaleString()}`
              : initial.steps
                ? "steps"
                : ""
          }
          accent="#0A84FF"
          progress={stepGoal ? initial.steps / stepGoal : undefined}
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
          accent="#FF2D55"
          onClick={() => setOpen("cardio")}
        />
        <MetricCard
          Icon={Droplets}
          label="Water"
          value={initial.water_oz ? formatWater(initial.water_oz, waterUnit) : "—"}
          unit={initial.water_oz ? waterUnit : ""}
          accent="#5AC8FA"
          onClick={() => setOpen("water")}
        />
        <MetricCard
          Icon={Moon}
          label="Sleep"
          value={initial.sleep_hours != null ? `${initial.sleep_hours}` : "—"}
          unit={initial.sleep_hours != null ? "hrs" : ""}
          accent="#BF5AF2"
          onClick={() => setOpen("sleep")}
        />
        <MetricCard
          Icon={StickyNote}
          label="Notes"
          value={initial.notes ? "Added" : "—"}
          unit=""
          accent="#FFD60A"
          onClick={() => setOpen("notes")}
        />
      </div>

      {/* Workout-complete toggle */}
      <button
        onClick={toggleDone}
        type="button"
        className={cn(
          "mt-4 flex min-h-[52px] w-full items-center justify-between rounded-2xl px-4 transition-all duration-200 ease-ios active:scale-[0.99]",
          done
            ? "bg-accent-green/15"
            : "bg-ink-800 hover:bg-ink-700",
        )}
      >
        <span className="flex items-center gap-2.5">
          <Dumbbell
            className={cn("h-5 w-5", done ? "text-accent-green" : "text-chalk-300")}
            strokeWidth={done ? 2.4 : 2}
          />
          <span className="text-[15px] font-semibold text-white">
            Workout completed
          </span>
        </span>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
            done
              ? "bg-accent-green/25 text-accent-green"
              : "bg-white/[0.06] text-chalk-300",
          )}
        >
          {done ? "Done" : "Tap"}
        </span>
      </button>

      <div className="mt-4">
        <div className="metric-label mb-2">How did you feel?</div>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { m: "great", Icon: Flame },
              { m: "good", Icon: Smile },
              { m: "meh", Icon: Meh },
              { m: "bad", Icon: Frown },
            ] as const
          ).map(({ m, Icon }) => (
            <button
              key={m}
              type="button"
              onClick={() => pickMood(m)}
              className={cn(
                "inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full text-[12px] font-semibold capitalize transition-all duration-200 ease-ios active:scale-[0.96]",
                mood === m
                  ? "bg-accent-blue/20 text-accent-blue"
                  : "bg-ink-800 text-chalk-300 hover:bg-ink-700",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={mood === m ? 2.4 : 2} />
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="metric-label mb-2">Progress photo</div>
        <ImageUploadButton
          folder="daily"
          identifier={entryDate}
          onImageUrl={(url) => {
            setPhotoUrl(url);
            start(async () => {
              await upsertDailyEntry({ entry_date: entryDate, photo_url: url });
            });
          }}
          existingUrl={photoUrl}
          onRemove={() => {
            setPhotoUrl(null);
            start(async () => {
              await upsertDailyEntry({ entry_date: entryDate, photo_url: null });
            });
          }}
        />
      </div>

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
        initialType={initial.cardio_type}
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
    </section>
  );
}

function MetricCard({
  Icon,
  label,
  value,
  unit,
  accent,
  progress,
  onClick,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  accent: string;
  /** 0–1 goal completion; renders a slim meter under the value. */
  progress?: number;
  onClick: () => void;
}) {
  const hasValue = value !== "" && value !== "—";
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[96px] flex-col justify-between rounded-2xl bg-ink-800 p-3.5 text-left transition-all duration-200 ease-ios active:scale-[0.98] hover:bg-ink-700"
    >
      <span
        className="grid h-8 w-8 place-items-center rounded-full"
        style={{ background: `${accent}1f` }}
      >
        <Icon className="h-4 w-4" style={{ color: accent }} />
      </span>
      <span>
        <span className="metric-label block">{label}</span>
        <span className="mt-0.5 flex items-baseline gap-1">
          <span
            className="font-display text-[22px] font-black leading-none tracking-tightest"
            style={{ color: hasValue ? accent : "#8e8e93" }}
          >
            {value}
          </span>
          {unit && (
            <span className="text-[11px] font-semibold text-chalk-400">{unit}</span>
          )}
        </span>
        {progress != null && (
          <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.round(progress * 100))}%`,
                background: accent,
              }}
            />
          </span>
        )}
      </span>
    </button>
  );
}
