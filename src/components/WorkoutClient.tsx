"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  House,
  Building,
  Sparkles,
  Library,
  Plus,
  RotateCcw,
  Trash2,
  Repeat,
  MoreVertical,
} from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import { WellnessSection } from "./WellnessSection";
import { SessionTimer } from "./SessionTimer";
import { AddExerciseSheet } from "./AddExerciseSheet";
import { SwipeableRow } from "./SwipeableRow";
import {
  GYM_DAYS,
  HOME_DAYS,
  type Exercise,
  type WorkoutDay,
} from "@/data/workouts";
import { cn } from "@/lib/cn";
import type { WorkoutMode } from "@/lib/types";
import {
  removeExerciseFromDay,
  resetDayToDefaults,
  type UserExerciseRow,
} from "@/lib/actions/workout-plan";

type AddTarget =
  | { kind: "add" }
  | { kind: "replace"; position: number; name: string };

/**
 * Map a day's free-form `focus` string ("Shoulders + Abs", "Back + Biceps",
 * "Cardio", ...) to the free-exercise-db muscle ids surfaced by the picker.
 * Returns { muscles, category }; category is set only for cardio days.
 */
function focusToPicker(focus: string): {
  muscles: string[];
  category?: string;
} {
  const lower = focus.toLowerCase();
  const muscles: string[] = [];
  const add = (...m: string[]) => {
    for (const x of m) if (!muscles.includes(x)) muscles.push(x);
  };
  if (lower.includes("shoulder")) add("shoulders");
  if (lower.includes("abs") || /\bab\b/.test(lower)) add("abdominals");
  if (lower.includes("back")) add("lats", "middle back");
  if (lower.includes("bicep")) add("biceps");
  if (lower.includes("chest")) add("chest");
  if (lower.includes("tricep")) add("triceps");
  if (lower.includes("arm")) add("biceps", "triceps");
  if (lower.includes("leg")) add("quadriceps", "hamstrings", "glutes", "calves");
  if (lower.includes("cardio")) return { muscles: [], category: "cardio" };
  return { muscles };
}

interface Props {
  initialMode: WorkoutMode;
  initialDay: number;
  todayTarget: number;
  todayBurn: number;
  dailyDeficit: number;
  lifeTDEE: number;
  weekTargets: number[];
  homePlan: UserExerciseRow[];
  gymPlan: UserExerciseRow[];
}

type DisplayExercise = { exercise: Exercise; position: number };

function rowToExercise(r: UserExerciseRow): Exercise {
  return {
    name: r.name,
    sets: r.sets,
    note: r.note ?? undefined,
    images: r.images ?? undefined,
    searchQuery: r.search_query ?? `${r.name} proper form tutorial`,
  };
}

export function WorkoutClient({
  initialMode,
  initialDay,
  todayTarget,
  todayBurn,
  dailyDeficit,
  lifeTDEE,
  weekTargets,
  homePlan,
  gymPlan,
}: Props) {
  const [view, setView] = useState<"training" | "wellness">("training");
  const [mode, setMode] = useState<WorkoutMode>(initialMode);
  const [wDay, setWDay] = useState(Math.max(0, initialDay));
  const [expanded, setExpanded] = useState(false);
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [openPos, setOpenPos] = useState<number | null>(null);
  const [mutPending, startMut] = useTransition();
  const days = mode === "gym" ? GYM_DAYS : HOME_DAYS;
  const d: WorkoutDay = days[wDay];
  const todayDayTarget = weekTargets[wDay] ?? todayTarget;
  const planRows = mode === "gym" ? gymPlan : homePlan;

  // Per (mode, dayIndex), if the user has ANY rows we treat the day as
  // customized and render only those rows. Otherwise we render the
  // hardcoded defaults from GYM_DAYS / HOME_DAYS.
  const { displayExercises, customized } = useMemo(() => {
    const userForThisDay = planRows.filter((r) => r.day_index === wDay);
    if (userForThisDay.length > 0) {
      return {
        displayExercises: userForThisDay.map<DisplayExercise>((r) => ({
          exercise: rowToExercise(r),
          position: r.position,
        })),
        customized: true,
      };
    }
    return {
      displayExercises: d.exercises.map<DisplayExercise>((ex, i) => ({
        exercise: ex,
        position: i,
      })),
      customized: false,
    };
  }, [planRows, wDay, d.exercises]);

  function handleDelete(position: number) {
    setOpenPos(null);
    startMut(async () => {
      await removeExerciseFromDay(mode, wDay, position);
    });
  }

  function handleReplace(position: number, name: string) {
    setOpenPos(null);
    setAddTarget({ kind: "replace", position, name });
  }

  function handleReset() {
    startMut(async () => {
      await resetDayToDefaults(mode, wDay);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-tiny">6-day split</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
            Workout plan
          </h1>
        </div>
        <div className="flex gap-1">
          <div className="flex rounded-xl bg-white/[0.06] p-0.5">
            {(
              [
                { k: "home", Icon: House, label: "Home" },
                { k: "gym", Icon: Building, label: "Gym" },
              ] as const
            ).map(({ k, Icon, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => { setMode(k); setView("training"); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  view === "training" && mode === k
                    ? "bg-white/[0.12] text-chalk-50"
                    : "text-chalk-400",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setView(view === "wellness" ? "training" : "wellness")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
              view === "wellness"
                ? "bg-accent-violet/20 text-accent-violet ring-1 ring-accent-violet/40"
                : "bg-white/[0.06] text-chalk-400 hover:text-chalk-200",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Wellness
          </button>
          <Link
            href="/workout/catalog"
            className="flex items-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-chalk-400 transition hover:text-chalk-200"
            aria-label="Browse exercise library"
          >
            <Library className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Library</span>
          </Link>
        </div>
      </div>

      {view === "wellness" && <WellnessSection />}

      {view === "training" && <>
      {/* Day picker */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {days.map((dd, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setWDay(i);
              setExpanded(false);
            }}
            className={cn(
              "shrink-0 rounded-xl border-2 px-3 py-2 text-center transition",
              wDay === i
                ? "text-ink-950"
                : "border-white/[0.07] bg-white/[0.04] text-chalk-300",
            )}
            style={
              wDay === i
                ? { background: dd.color, borderColor: dd.color }
                : undefined
            }
          >
            <div className="text-base leading-none">{dd.icon}</div>
            <div className="mt-1 text-[10px] font-extrabold">{dd.day}</div>
            <div className="text-[9px] opacity-80">{dd.weekday}</div>
          </button>
        ))}
      </div>

      {/* Calorie banner */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="block w-full text-left"
      >
        <div
          className="rounded-2xl border p-4"
          style={{
            background: `linear-gradient(135deg, ${d.color}1f, ${d.color}07)`,
            borderColor: `${d.color}55`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <div
                  className="text-[10px] uppercase tracking-[2px]"
                  style={{ color: d.color }}
                >
                  Eat today · {d.focus}
                </div>
                <div
                  className="text-3xl font-black leading-none"
                  style={{ color: d.color }}
                >
                  {todayDayTarget.toLocaleString()}
                </div>
                <div className="text-[11px] text-chalk-400">cal target</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-chalk-400">🔥 Burn</div>
              <div className="text-base font-extrabold text-accent-amber">
                ~{todayBurn}
              </div>
              <div className="mt-1 text-[10px] text-chalk-400">Deficit</div>
              <div className="text-sm font-bold text-accent-green">
                {dailyDeficit} cal
              </div>
            </div>
          </div>
          {expanded ? (
            <div
              className="mt-3 border-t pt-3 text-[11px]"
              style={{ borderColor: `${d.color}25` }}
            >
              <div className="flex flex-wrap gap-2">
                <span className="text-chalk-50">
                  Life TDEE: {lifeTDEE.toLocaleString()}
                </span>
                <span className="text-accent-green">+ burn: {todayBurn}</span>
                <span className="text-accent-rose">
                  − deficit: {dailyDeficit}
                </span>
                <span className="font-bold" style={{ color: d.color }}>
                  = eat: {todayDayTarget.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-chalk-300">{d.calNote}</div>
              {d.epoc ? (
                <div className="mt-1 text-accent-amber">
                  ⚡ EPOC: this session keeps burning 10–15% extra for hours
                  after.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>

      {/* Session timer */}
      <SessionTimer color={d.color} />

      {/* Day card with exercises */}
      <div
        className="rounded-2xl border"
        style={{
          background: `${d.color}10`,
          borderColor: `${d.color}33`,
        }}
      >
        <div
          className="flex items-center gap-3 rounded-t-2xl px-4 py-3"
          style={{
            background: `${d.color}1f`,
            borderBottom: `1px solid ${d.color}22`,
          }}
        >
          <div
            className="grid h-10 w-10 place-items-center rounded-xl border-2 text-lg"
            style={{
              background: `${d.color}28`,
              borderColor: d.color,
            }}
          >
            {d.icon}
          </div>
          <div>
            <div
              className="text-[10px] uppercase tracking-[3px]"
              style={{ color: d.color }}
            >
              {d.day} · {d.weekday}
            </div>
            <div className="text-base font-extrabold text-chalk-50">
              {d.focus}
            </div>
            <div className="text-[10px] text-chalk-500">
              {mode === "gym" ? "Gym" : "Home"} · {d.duration}
            </div>
          </div>
        </div>
        <div className="rounded-b-2xl bg-ink-850 px-1 py-1">
          {displayExercises.map((row, i) => (
            <SwipeableRow
              key={`${row.exercise.name}-${row.position}`}
              forceOpen={openPos === row.position}
              onOpen={() => setOpenPos(row.position)}
              actions={
                <div className="flex h-full w-full">
                  <button
                    type="button"
                    onClick={() => handleReplace(row.position, row.exercise.name)}
                    disabled={mutPending}
                    className="flex h-full flex-1 flex-col items-center justify-center gap-1 bg-accent-cyan/90 text-[11px] font-extrabold uppercase tracking-wider text-ink-950 transition hover:bg-accent-cyan disabled:opacity-60"
                    aria-label={`Replace ${row.exercise.name}`}
                  >
                    <Repeat className="h-4 w-4" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.position)}
                    disabled={mutPending}
                    className="flex h-full flex-1 flex-col items-center justify-center gap-1 bg-accent-rose/90 text-[11px] font-extrabold uppercase tracking-wider text-ink-950 transition hover:bg-accent-rose disabled:opacity-60"
                    aria-label={`Delete ${row.exercise.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              }
            >
              <div className="relative pr-7 pl-3">
                <ExerciseCard
                  index={i}
                  exercise={row.exercise}
                  color={d.color}
                />
                <button
                  type="button"
                  onClick={() =>
                    setOpenPos(openPos === row.position ? null : row.position)
                  }
                  aria-label={`Options for ${row.exercise.name}`}
                  aria-expanded={openPos === row.position}
                  className="absolute right-0 top-3 grid h-8 w-8 place-items-center rounded-lg text-chalk-400 transition hover:bg-white/[0.06] hover:text-chalk-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            </SwipeableRow>
          ))}
        </div>
      </div>

      {/* Day-card footer: prominent Add CTA + Reset (when customized).
          Swipe left on any exercise above for Replace / Delete. */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setAddTarget({ kind: "add" })}
          disabled={mutPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-4 text-sm font-extrabold transition disabled:opacity-50"
          style={{
            color: d.color,
            borderColor: `${d.color}66`,
            background: `${d.color}10`,
          }}
        >
          <Plus className="h-5 w-5" />
          Add exercise to {d.day}
        </button>

        <div className="flex items-center justify-between gap-2 px-1 text-[10px] uppercase tracking-wider text-chalk-500">
          <span className="hidden sm:inline">
            Swipe a row left for Replace / Delete · or tap{" "}
            <MoreVertical className="inline h-3 w-3 -translate-y-px" />
          </span>
          <span className="sm:hidden">
            Swipe ← on a row for options
          </span>
          <div className="flex items-center gap-2">
            <span>{customized ? "Custom" : "Default"}</span>
            {customized && (
              <button
                type="button"
                onClick={handleReset}
                disabled={mutPending}
                className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1 text-[10px] font-bold text-chalk-300 transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {d.cardio ? (
        <div className="rounded-2xl border border-accent-amber/20 bg-accent-amber/[0.06] p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🚴</span>
            <div>
              <div className="text-[10px] uppercase tracking-[2px] text-accent-amber">
                Post-workout cardio
              </div>
              <div className="text-xs text-chalk-300">{d.cardio}</div>
            </div>
          </div>
        </div>
      ) : null}
      </>}

      {addTarget && (() => {
        const picker = focusToPicker(d.focus);
        return (
          <AddExerciseSheet
            mode={mode}
            dayIndex={wDay}
            dayLabel={`${d.day} · ${d.focus}`}
            dayColor={d.color}
            focusMuscles={picker.muscles}
            focusCategory={picker.category}
            replaceTarget={
              addTarget.kind === "replace"
                ? { position: addTarget.position, name: addTarget.name }
                : undefined
            }
            onClose={() => setAddTarget(null)}
          />
        );
      })()}
    </div>
  );
}
