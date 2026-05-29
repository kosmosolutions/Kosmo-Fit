"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
  Bike,
  Flame,
  Timer,
  LayoutDashboard,
} from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import { WellnessSection } from "./WellnessSection";
import { SessionTimer } from "./SessionTimer";
import { AddExerciseSheet } from "./AddExerciseSheet";
import { PlanPicker } from "./PlanPicker";
import { MarkCompleteToggle } from "./MarkCompleteToggle";
import { CardioLogPopup } from "./CardioLogPopup";
import { SwipeableRow } from "./SwipeableRow";
import {
  GYM_DAYS,
  HOME_DAYS,
  type Exercise,
  type WorkoutDay,
} from "@/data/workouts";
import { getTemplate } from "@/data/workout-templates";
import { estimateSessionBurn } from "@/lib/calc";
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
 * Pull duration, activity and calorie-burn out of a free-form cardio
 * string like "10–15 min bike · +80–110 cal" so we can render each as
 * its own visual chip. Missing parts return empty strings.
 */
function parseCardio(raw: string): {
  duration: string;
  activity: string;
  calories: string | null;
} {
  const calMatch = raw.match(/\+?\d[\d–\-]*\s*cal/i);
  const calories = calMatch ? calMatch[0].trim() : null;
  let rest = calMatch ? raw.replace(calMatch[0], "") : raw;
  rest = rest.replace(/[·•]\s*$/g, "").trim();
  const durMatch = rest.match(/^\d[\d–\-]*\s*min/i);
  const duration = durMatch ? durMatch[0].trim() : "";
  let activity = rest.replace(duration, "").replace(/^[·•\s\-]+/, "").trim();
  if (!activity) activity = "Steady-state cardio";
  return { duration, activity, calories };
}

function PostWorkoutCardio({ raw }: { raw: string }) {
  const { duration, activity, calories } = parseCardio(raw);
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-accent-amber/25"
      style={{
        background:
          "linear-gradient(135deg, rgba(251,191,36,0.16), rgba(251,191,36,0.04) 60%, rgba(251,191,36,0.02))",
      }}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-accent-amber/15 blur-3xl" />
      <div className="relative p-4">
        <div className="flex items-center gap-2 text-accent-amber">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-accent-amber/20 ring-1 ring-accent-amber/30">
            <Bike className="h-4 w-4" />
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[3px]">
            Post-workout cardio
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="text-2xl font-black leading-tight tracking-tight text-chalk-50">
              {duration || raw}
            </div>
            <div className="mt-0.5 truncate text-xs font-semibold capitalize text-chalk-300">
              {activity}
            </div>
          </div>
          {calories ? (
            <div className="flex shrink-0 flex-col items-end rounded-xl border border-accent-amber/30 bg-accent-amber/10 px-3 py-1.5 leading-tight">
              <div className="text-[9px] font-bold uppercase tracking-wider text-accent-amber/80">
                Extra burn
              </div>
              <div className="text-base font-black text-accent-amber">
                {calories.replace(/^\+/, "")}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {duration ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-chalk-300">
              <Timer className="h-3 w-3" />
              {duration}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full border border-accent-amber/25 bg-accent-amber/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-amber">
            <Flame className="h-3 w-3" />
            Zone 2
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-chalk-300">
            Closes today&apos;s gap
          </span>
        </div>
      </div>
    </div>
  );
}

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
  weekBurns: number[];
  restTarget: number;
  homePlan: UserExerciseRow[];
  gymPlan: UserExerciseRow[];
  activeTemplateId: string | null;
  todayDate: string;
  todayCompleted: boolean;
  todayCardioMinutes: number;
  todayCardioCalories: number;
  bodyWeightLbs: number;
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
  weekBurns,
  restTarget,
  homePlan,
  gymPlan,
  activeTemplateId,
  todayDate,
  todayCompleted,
  todayCardioMinutes,
  todayCardioCalories,
  bodyWeightLbs,
}: Props) {
  const [cardioOpen, setCardioOpen] = useState(false);
  const [view, setView] = useState<"training" | "wellness">("training");
  const [mode, setMode] = useState<WorkoutMode>(initialMode);
  const [wDay, setWDay] = useState(Math.max(0, initialDay));
  const [expanded, setExpanded] = useState(false);
  const [addTarget, setAddTarget] = useState<AddTarget | null>(null);
  const [openPos, setOpenPos] = useState<number | null>(null);
  const [mutPending, startMut] = useTransition();

  // The active template defines the day layout (focus, color, default
  // exercises). If a template is set, its days replace the legacy
  // GYM_DAYS/HOME_DAYS defaults; otherwise we render the original split.
  const activeTemplate = activeTemplateId ? getTemplate(activeTemplateId) : null;
  const days: WorkoutDay[] = activeTemplate
    ? activeTemplate.days[mode]
    : mode === "gym"
      ? GYM_DAYS
      : HOME_DAYS;
  const d: WorkoutDay = days[wDay] ?? days[0];

  // Show picker automatically on first /workout visit (no template selected
  // and no customizations). Existing users were backfilled to "custom-6day"
  // in migration so they won't see this.
  const hasCustomizations = homePlan.length > 0 || gymPlan.length > 0;
  const [pickerOpen, setPickerOpen] = useState(
    activeTemplateId === null && !hasCustomizations,
  );
  useEffect(() => {
    if (activeTemplateId === null && !hasCustomizations) {
      setPickerOpen(true);
    }
  }, [activeTemplateId, hasCustomizations]);
  // Per-day calorie target + burn for the selected day.
  //
  // Legacy split (no template, or custom-6day) keeps the hand-tuned
  // positional BURNS table. Real templates derive each day from its own
  // structure: rest days fall to the rest target, training days estimate
  // burn from duration + focus. This stops a 3-day template's rest slots
  // from showing a workout-day calorie target.
  const isLegacyPlan = !activeTemplate || activeTemplate.id === "custom-6day";
  const isRestDay = d.exercises.length === 0 || d.focus === "Rest";
  const selectedBurn = isLegacyPlan
    ? (weekBurns[wDay] ?? todayBurn)
    : estimateSessionBurn(d);
  const todayDayTarget = isLegacyPlan
    ? (weekTargets[wDay] ?? todayTarget)
    : isRestDay
      ? restTarget
      : Math.max(1400, lifeTDEE + selectedBurn - dailyDeficit);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="label-tiny">
            {activeTemplate
              ? `${activeTemplate.dayCount}-day · ${activeTemplate.tagline}`
              : "6-day split"}
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
            {activeTemplate ? activeTemplate.name : "Workout plan"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-accent-violet/40 bg-accent-violet/10 px-3.5 py-2 text-sm font-bold text-accent-violet transition hover:bg-accent-violet/20"
            aria-label="Change workout plan"
          >
            <LayoutDashboard className="h-4 w-4" />
            Change plan
          </button>
          <Link
            href="/workout/catalog"
            className="inline-flex items-center gap-2 rounded-xl border border-accent-blue/40 bg-accent-blue/10 px-3.5 py-2 text-sm font-bold text-accent-cyan shadow-glow transition hover:bg-accent-blue/20"
            aria-label="Browse exercise library"
          >
            <Library className="h-4 w-4" />
            Browse library
          </Link>
        </div>
        <div className="flex w-full gap-1 sm:w-auto">
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
                {selectedBurn > 0 ? `~${selectedBurn}` : "—"}
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
                <span className="text-accent-green">+ burn: {selectedBurn}</span>
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

      {/* Session controls (skip on rest days) */}
      {d.focus !== "Rest" && (
        <div className="space-y-2">
          <SessionTimer color={d.color} />
          <MarkCompleteToggle
            entryDate={todayDate}
            completed={todayCompleted}
            dayIndex={wDay}
            mode={mode}
            color={d.color}
          />
        </div>
      )}

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
          {displayExercises.length === 0 && d.focus === "Rest" && (
            <div className="px-3 py-6 text-center">
              <div className="text-3xl">😴</div>
              <div className="mt-2 text-sm font-bold text-chalk-200">
                Rest day
              </div>
              <div className="mt-0.5 text-xs text-chalk-400">
                Sleep, hydrate, light walking. Recovery is when growth happens.
              </div>
            </div>
          )}
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

      {d.cardio ? <PostWorkoutCardio raw={d.cardio} /> : null}

      {/* Today's cardio log — opens popup to enter minutes or calories */}
      <button
        type="button"
        onClick={() => setCardioOpen(true)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.06]"
        aria-label="Log cardio session"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-amber/15 ring-1 ring-accent-amber/30">
            <Bike className="h-4 w-4 text-accent-amber" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[2px] text-chalk-500">
              {todayCardioMinutes > 0 || todayCardioCalories > 0
                ? "Today's cardio"
                : "Log cardio"}
            </div>
            <div className="text-sm font-extrabold text-chalk-50">
              {todayCardioMinutes > 0 || todayCardioCalories > 0
                ? `${todayCardioMinutes} min · ${todayCardioCalories.toLocaleString()} cal`
                : "Add a session — minutes or calories"}
            </div>
          </div>
        </div>
        <Plus className="h-4 w-4 text-chalk-400" />
      </button>
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

      <PlanPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        activeTemplateId={activeTemplateId}
        hasCustomizations={hasCustomizations}
      />

      <CardioLogPopup
        open={cardioOpen}
        onClose={() => setCardioOpen(false)}
        entryDate={todayDate}
        bodyWeightLbs={bodyWeightLbs}
        initialMinutes={todayCardioMinutes}
        initialCalories={todayCardioCalories}
      />
    </div>
  );
}
