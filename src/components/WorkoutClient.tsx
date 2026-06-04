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
  Pencil,
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
  type WorkoutPlanRow,
} from "@/lib/actions/workout-plan";
import type { BuiltDay } from "@/lib/workout-plan-types";
import { WEEKDAY_LABELS } from "@/data/focus-presets";

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

function PostWorkoutCardio({
  raw,
  loggedMinutes,
  loggedCalories,
  onLog,
}: {
  raw: string;
  loggedMinutes: number;
  loggedCalories: number;
  onLog: () => void;
}) {
  const { duration, activity, calories } = parseCardio(raw);
  const hasLog = loggedMinutes > 0 || loggedCalories > 0;
  return (
    <button
      type="button"
      onClick={onLog}
      aria-label={hasLog ? "Edit cardio session" : "Log cardio session"}
      className="group relative block w-full overflow-hidden rounded-2xl bg-ink-850 text-left transition-all duration-200 ease-ios active:scale-[0.99] hover:bg-ink-800"
    >
      <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-accent-rose/15 blur-3xl" />
      <div className="relative p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-accent-rose">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-accent-rose/20">
              <Bike className="h-4 w-4" />
            </div>
            <div className="metric-label text-accent-rose">
              Post-workout cardio
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-accent-rose/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-rose">
            {hasLog ? (
              <>
                <Pencil className="h-3 w-3" /> Edit
              </>
            ) : (
              <>
                <Plus className="h-3 w-3" /> Log
              </>
            )}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-[28px] font-black leading-none tracking-tightest text-white">
              {duration || raw}
            </div>
            <div className="mt-1 truncate text-[13px] font-medium capitalize text-chalk-300">
              {activity}
            </div>
          </div>
          {calories ? (
            <div className="flex shrink-0 flex-col items-end rounded-2xl bg-accent-rose/15 px-3 py-2 leading-tight">
              <div className="metric-label text-accent-rose">Target</div>
              <div className="font-display text-[18px] font-black tracking-tightest text-accent-rose">
                {calories.replace(/^\+/, "")}
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
          <div className="metric-label">
            {hasLog ? "Logged today" : "Not logged"}
          </div>
          <div className="text-[14px] font-semibold text-white">
            {hasLog
              ? `${loggedMinutes} min · ${loggedCalories.toLocaleString()} cal`
              : "Tap to add"}
          </div>
        </div>
      </div>
    </button>
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
  builtDays: BuiltDay[] | null;
  plans: WorkoutPlanRow[];
  activePlanId: string | null;
  activePlanName: string | null;
  todayDate: string;
  isToday: boolean;
  todayCompleted: boolean;
  completedDayIndex: number | null;
  todayCardioMinutes: number;
  todayCardioCalories: number;
  todayCardioType: string | null;
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
  builtDays,
  plans,
  activePlanId,
  activePlanName,
  todayDate,
  isToday,
  todayCompleted,
  completedDayIndex,
  todayCardioMinutes,
  todayCardioCalories,
  todayCardioType,
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
  // A built plan carries its own day layout (focus/weekday/visuals); its
  // exercises live in plan-scoped rows, so the synthesized days start empty
  // and the renderer fills them from planRows. Otherwise the active template
  // (or the legacy split) defines the layout.
  const isBuilt = builtDays != null;
  const activeTemplate =
    !isBuilt && activeTemplateId ? getTemplate(activeTemplateId) : null;
  const days: WorkoutDay[] = isBuilt
    ? builtDays.map((bd, i) => ({
        day: `Day ${i + 1}`,
        weekday: WEEKDAY_LABELS[bd.weekday] ?? "—",
        focus: bd.focus,
        icon: bd.icon,
        color: bd.color,
        duration: bd.duration,
        epoc: false,
        calNote: `${bd.focus} session.`,
        exercises: [],
      }))
    : activeTemplate
      ? activeTemplate.days[mode]
      : mode === "gym"
        ? GYM_DAYS
        : HOME_DAYS;
  const d: WorkoutDay = days[wDay] ?? days[0];

  // Show picker automatically on first /workout visit (no template selected
  // and no customizations). Existing users were backfilled to "custom-6day"
  // in migration so they won't see this.
  const hasCustomizations = homePlan.length > 0 || gymPlan.length > 0;
  const isNewUser =
    activeTemplateId === null && activePlanId === null && !hasCustomizations;
  const [pickerOpen, setPickerOpen] = useState(isNewUser);
  useEffect(() => {
    if (isNewUser) setPickerOpen(true);
  }, [isNewUser]);
  // Per-day calorie target + burn for the selected day.
  //
  // Legacy split (no template, or custom-6day) keeps the hand-tuned
  // positional BURNS table. Real templates derive each day from its own
  // structure: rest days fall to the rest target, training days estimate
  // burn from duration + focus. This stops a 3-day template's rest slots
  // from showing a workout-day calorie target.
  const planRows = mode === "gym" ? gymPlan : homePlan;
  // Built plans price each day by its own structure (like templates), never
  // the legacy 6-slot BURNS table. Use the day's actual exercise count —
  // customized rows when present, else the layout's defaults — so the estimate
  // tracks what's really scheduled.
  const isLegacyPlan =
    !isBuilt && (!activeTemplate || activeTemplate.id === "custom-6day");
  const dayRowCount = planRows.filter((r) => r.day_index === wDay).length;
  const effectiveCount = dayRowCount > 0 ? dayRowCount : d.exercises.length;
  const isRestDay = effectiveCount === 0 || d.focus === "Rest";
  const selectedBurn = isLegacyPlan
    ? (weekBurns[wDay] ?? todayBurn)
    : isRestDay
      ? 0
      : estimateSessionBurn({
          duration: d.duration,
          focus: d.focus,
          exercises: new Array(effectiveCount),
        });
  const todayDayTarget = isLegacyPlan
    ? (weekTargets[wDay] ?? todayTarget)
    : isRestDay
      ? restTarget
      : Math.max(1400, lifeTDEE + selectedBurn - dailyDeficit);

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
      {!isToday && (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-accent-blue/10 px-4 py-2.5">
          <div className="text-[13px] font-semibold text-accent-blue">
            Logging for{" "}
            {new Date(`${todayDate}T00:00:00`).toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
          <Link
            href="/workout"
            className="inline-flex items-center gap-1 rounded-full bg-accent-blue/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-blue transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-accent-blue/30"
          >
            Today
          </Link>
        </div>
      )}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="metric-label">
              {activePlanName
                ? isBuilt
                  ? `Custom program · ${days.length}-day`
                  : `Custom plan${activeTemplate ? ` · ${activeTemplate.dayCount}-day` : ""}`
                : activeTemplate
                  ? `${activeTemplate.dayCount}-day · ${activeTemplate.tagline}`
                  : "6-day split"}
            </div>
            <h1 className="display truncate text-[28px] leading-tight text-white">
              {activePlanName ?? (activeTemplate ? activeTemplate.name : "Workout plan")}
            </h1>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-ink-800 px-3 text-[12px] font-semibold text-white transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-700"
              aria-label="Change workout plan"
            >
              <LayoutDashboard className="h-3.5 w-3.5 text-accent-green" />
              Plan
            </button>
            <Link
              href="/workout/catalog"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-ink-800 px-3 text-[12px] font-semibold text-white transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-700"
              aria-label="Browse exercise library"
            >
              <Library className="h-3.5 w-3.5 text-accent-blue" />
              Library
            </Link>
          </div>
        </div>

        {/* Mode + view segmented control */}
        <div className="flex gap-1 rounded-full bg-ink-800 p-1">
          {(
            [
              { k: "home", Icon: House, label: "Home" },
              { k: "gym", Icon: Building, label: "Gym" },
            ] as const
          ).map(({ k, Icon, label }) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setMode(k);
                setView("training");
              }}
              className={cn(
                "flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ease-ios",
                view === "training" && mode === k
                  ? "bg-ink-700 text-white"
                  : "text-chalk-400 hover:text-white",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setView("wellness")}
            className={cn(
              "flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ease-ios",
              view === "wellness"
                ? "bg-accent-violet/20 text-accent-violet"
                : "text-chalk-400 hover:text-white",
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
      <div className="flex gap-1.5">
        {days.map((dd, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setWDay(i);
              setExpanded(false);
            }}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-2.5 transition-all duration-200 ease-ios active:scale-[0.96]",
              wDay === i ? "text-black" : "bg-ink-800 text-chalk-300 hover:bg-ink-700",
            )}
            style={wDay === i ? { background: dd.color } : undefined}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-[0.06em]"
              style={{ opacity: wDay === i ? 0.7 : 1 }}
            >
              {dd.weekday}
            </span>
            <span className="whitespace-nowrap text-[12px] font-bold leading-tight">
              {dd.day}
            </span>
          </button>
        ))}
      </div>

      {/* Calorie scoreboard */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="block w-full text-left"
        aria-expanded={expanded}
      >
        <div className="rounded-2xl bg-ink-850 p-5 shadow-bento">
          <div
            className="text-center text-[19px] font-bold tracking-tight"
            style={{ color: d.color }}
          >
            {d.focus}
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div
                className="metric-value"
                style={{ color: d.color }}
              >
                {todayDayTarget.toLocaleString()}
              </div>
              <div className="mt-1 text-[12px] font-medium text-chalk-400">
                cal target
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <div className="rounded-2xl bg-ink-800 px-3 py-2 text-right leading-tight">
                <div className="flex items-center justify-end gap-1 metric-label text-accent-rose">
                  <Flame className="h-3 w-3" /> Burn
                </div>
                <div className="mt-0.5 font-display text-[18px] font-black tracking-tightest text-accent-rose">
                  {selectedBurn > 0 ? `~${selectedBurn}` : "—"}
                </div>
              </div>
              <div className="rounded-2xl bg-ink-800 px-3 py-2 text-right leading-tight">
                <div className="metric-label text-accent-green">Deficit</div>
                <div className="mt-0.5 font-display text-[18px] font-black tracking-tightest text-accent-green">
                  {dailyDeficit}
                </div>
              </div>
            </div>
          </div>
          {expanded ? (
            <div className="mt-4 border-t border-white/[0.06] pt-3 text-[12px] font-medium">
              <div className="flex flex-wrap gap-2">
                <span className="text-white">
                  Life TDEE: {lifeTDEE.toLocaleString()}
                </span>
                <span className="text-accent-green">+ burn: {selectedBurn}</span>
                <span className="text-accent-rose">
                  − deficit: {dailyDeficit}
                </span>
                <span className="font-semibold" style={{ color: d.color }}>
                  = eat: {todayDayTarget.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-chalk-300">{d.calNote}</div>
              {d.epoc ? (
                <div className="mt-1 text-accent-amber">
                  EPOC: this session keeps burning 10–15% extra for hours after.
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
            completed={todayCompleted && completedDayIndex === wDay}
            dayIndex={wDay}
            mode={mode}
            color={d.color}
          />
        </div>
      )}

      {/* Day card with exercises */}
      <div className="overflow-hidden rounded-2xl bg-ink-850 shadow-bento">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div
            className="grid h-11 w-11 place-items-center rounded-full text-lg"
            style={{ background: `${d.color}22` }}
          >
            {d.icon}
          </div>
          <div>
            <div
              className="metric-label"
              style={{ color: d.color }}
            >
              {d.day} · {d.weekday}
            </div>
            <div className="text-[17px] font-bold text-white">
              {d.focus}
            </div>
            <div className="text-[11px] font-medium text-chalk-400">
              {mode === "gym" ? "Gym" : "Home"} · {d.duration}
            </div>
          </div>
        </div>
        <div className="bg-ink-850 px-1 py-1">
          {displayExercises.length === 0 && d.focus === "Rest" && (
            <div className="px-4 py-8 text-center">
              <div className="text-4xl">😴</div>
              <div className="mt-3 text-[17px] font-bold text-white">
                Rest day
              </div>
              <div className="mt-1 text-[13px] font-medium text-chalk-400">
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
                    className="flex h-full flex-1 flex-col items-center justify-center gap-1 bg-accent-blue text-[11px] font-semibold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-60"
                    aria-label={`Replace ${row.exercise.name}`}
                  >
                    <Repeat className="h-4 w-4" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(row.position)}
                    disabled={mutPending}
                    className="flex h-full flex-1 flex-col items-center justify-center gap-1 bg-accent-rose text-[11px] font-semibold uppercase tracking-wider text-white transition hover:brightness-110 disabled:opacity-60"
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

      {/* Add CTA + Reset */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setAddTarget({ kind: "add" })}
          disabled={mutPending}
          className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-all duration-200 ease-ios active:scale-[0.98] disabled:opacity-50"
          style={{
            color: d.color,
            background: `${d.color}1f`,
          }}
        >
          <Plus className="h-5 w-5" />
          Add exercise to {d.day}
        </button>

        <div className="flex items-center justify-between gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-chalk-400">
          <span className="hidden sm:inline">
            Swipe left for Replace / Delete · or tap{" "}
            <MoreVertical className="inline h-3 w-3 -translate-y-px" />
          </span>
          <span className="sm:hidden">
            Swipe ← for options
          </span>
          <div className="flex items-center gap-2">
            <span>{customized ? "Custom" : "Default"}</span>
            {customized && (
              <button
                type="button"
                onClick={handleReset}
                disabled={mutPending}
                className="inline-flex items-center gap-1 rounded-full bg-ink-800 px-3 py-1 text-[11px] font-semibold text-chalk-200 transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-700 disabled:opacity-50"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cardio: the day's prescription doubles as the log trigger. Days
          without a prescription get a plain log card so logging stays
          available everywhere. */}
      {d.cardio ? (
        <PostWorkoutCardio
          raw={d.cardio}
          loggedMinutes={todayCardioMinutes}
          loggedCalories={todayCardioCalories}
          onLog={() => setCardioOpen(true)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCardioOpen(true)}
          className="flex min-h-[60px] w-full items-center justify-between gap-3 rounded-2xl bg-ink-850 px-4 text-left transition-all duration-200 ease-ios active:scale-[0.99] hover:bg-ink-800"
          aria-label={
            todayCardioMinutes > 0 || todayCardioCalories > 0
              ? "Edit cardio session"
              : "Log cardio session"
          }
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-accent-rose/20">
              <Bike className="h-5 w-5 text-accent-rose" />
            </div>
            <div>
              <div className="metric-label">
                {todayCardioMinutes > 0 || todayCardioCalories > 0
                  ? "Today's cardio"
                  : "Log cardio"}
              </div>
              <div className="text-[15px] font-semibold text-white">
                {todayCardioMinutes > 0 || todayCardioCalories > 0
                  ? `${todayCardioMinutes} min · ${todayCardioCalories.toLocaleString()} cal`
                  : "Add session"}
              </div>
            </div>
          </div>
          {todayCardioMinutes > 0 || todayCardioCalories > 0 ? (
            <Pencil className="h-4 w-4 text-chalk-400" />
          ) : (
            <Plus className="h-4 w-4 text-chalk-400" />
          )}
        </button>
      )}
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
        activeTemplateId={activePlanId ? null : activeTemplateId}
        plans={plans}
        activePlanId={activePlanId}
        hasCustomizations={hasCustomizations}
      />

      <CardioLogPopup
        open={cardioOpen}
        onClose={() => setCardioOpen(false)}
        entryDate={todayDate}
        bodyWeightLbs={bodyWeightLbs}
        initialMinutes={todayCardioMinutes}
        initialCalories={todayCardioCalories}
        initialType={todayCardioType}
      />
    </div>
  );
}
