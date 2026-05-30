/**
 * Focus presets for the "Create your own" plan builder.
 *
 * A built plan is a set of training days, each tagged with a focus. The focus
 * drives three things: the day's visual identity (icon/color/duration), which
 * muscle groups it targets, and the auto-filled exercise set pulled from the
 * free-exercise-db catalog (public/exercise-catalog.json).
 *
 * Shared by the client builder (preview + auto-fill) and the server action
 * (day-layout metadata), so it must stay dependency-free.
 */

import type { WorkoutMode } from "@/lib/types";

const FED_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// Equipment that needs no gym — Home mode is filtered to this subset.
// Mirrors AddExerciseSheet's HOME_EQUIPMENT.
const HOME_EQUIPMENT = new Set([
  "body only",
  "dumbbell",
  "bands",
  "kettlebells",
]);

// free-exercise-db categories that count as resistance training. Stretching
// is excluded from auto-fill; cardio is handled by its own preset.
const STRENGTH_CATEGORIES = new Set([
  "strength",
  "plyometrics",
  "powerlifting",
  "strongman",
  "olympic weightlifting",
]);

export interface CatalogExercise {
  id: string;
  name: string;
  level: "beginner" | "intermediate" | "expert";
  equipment: string | null;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
}

export interface FocusPreset {
  key: string;
  label: string;
  icon: string;
  color: string;
  duration: string;
  // primaryMuscle ids (free-exercise-db vocabulary) this focus draws from.
  muscles: string[];
  // Set when the focus is conditioning rather than resistance work.
  cardio?: boolean;
}

export const FOCUS_PRESETS: FocusPreset[] = [
  {
    key: "push",
    label: "Push",
    icon: "🫁",
    color: "#f87171",
    duration: "~50 min",
    muscles: ["chest", "shoulders", "triceps"],
  },
  {
    key: "pull",
    label: "Pull",
    icon: "💪",
    color: "#a78bfa",
    duration: "~50 min",
    muscles: ["lats", "middle back", "biceps", "traps"],
  },
  {
    key: "legs",
    label: "Legs",
    icon: "🦵",
    color: "#4ade80",
    duration: "~55 min",
    muscles: ["quadriceps", "hamstrings", "glutes", "calves"],
  },
  {
    key: "upper",
    label: "Upper body",
    icon: "🏋️",
    color: "#38bdf8",
    duration: "~55 min",
    muscles: ["chest", "lats", "shoulders", "middle back", "biceps", "triceps"],
  },
  {
    key: "lower",
    label: "Lower body",
    icon: "🔥",
    color: "#fb923c",
    duration: "~50 min",
    muscles: ["quadriceps", "hamstrings", "glutes", "calves", "adductors"],
  },
  {
    key: "full",
    label: "Full body",
    icon: "⚡",
    color: "#22d3ee",
    duration: "~55 min",
    muscles: ["quadriceps", "chest", "lats", "shoulders", "hamstrings"],
  },
  {
    key: "chest",
    label: "Chest",
    icon: "💥",
    color: "#f43f5e",
    duration: "~45 min",
    muscles: ["chest"],
  },
  {
    key: "back",
    label: "Back",
    icon: "🪨",
    color: "#6366f1",
    duration: "~50 min",
    muscles: ["lats", "middle back", "lower back", "traps"],
  },
  {
    key: "shoulders",
    label: "Shoulders",
    icon: "🏔️",
    color: "#f59e0b",
    duration: "~40 min",
    muscles: ["shoulders"],
  },
  {
    key: "arms",
    label: "Arms",
    icon: "💪",
    color: "#d946ef",
    duration: "~40 min",
    muscles: ["biceps", "triceps", "forearms"],
  },
  {
    key: "core",
    label: "Core",
    icon: "🔥",
    color: "#fb923c",
    duration: "~30 min",
    muscles: ["abdominals"],
  },
  {
    key: "cardio",
    label: "Cardio",
    icon: "🚴",
    color: "#fbbf24",
    duration: "~30 min",
    muscles: [],
    cardio: true,
  },
];

export function getFocusPreset(key: string): FocusPreset | undefined {
  return FOCUS_PRESETS.find((p) => p.key === key);
}

const LEVEL_RANK: Record<CatalogExercise["level"], number> = {
  beginner: 0,
  intermediate: 1,
  expert: 2,
};

/**
 * Auto-pick a balanced set of exercises for a focus. Walks each target muscle
 * round-robin so a Push day lands chest + shoulders + triceps rather than five
 * chest presses. Beginner/intermediate movements rank first. Deterministic so
 * the same focus always yields the same set (stable across renders).
 */
export function pickExercisesForFocus(
  catalog: CatalogExercise[],
  focusKey: string,
  mode: WorkoutMode,
  count = 5,
): CatalogExercise[] {
  const preset = getFocusPreset(focusKey);
  if (!preset) return [];

  const modeOk = (e: CatalogExercise) =>
    mode === "gym" || !e.equipment || HOME_EQUIPMENT.has(e.equipment);

  if (preset.cardio) {
    return catalog
      .filter((e) => e.category === "cardio" && modeOk(e))
      .slice(0, count);
  }

  const buckets = preset.muscles.map((m) =>
    catalog
      .filter(
        (e) =>
          e.primaryMuscles.includes(m) &&
          e.category != null &&
          STRENGTH_CATEGORIES.has(e.category) &&
          modeOk(e),
      )
      .sort(
        (a, b) =>
          LEVEL_RANK[a.level] - LEVEL_RANK[b.level] ||
          a.name.localeCompare(b.name),
      ),
  );

  const chosen: CatalogExercise[] = [];
  const seen = new Set<string>();
  while (chosen.length < count) {
    let progressed = false;
    for (const bucket of buckets) {
      const next = bucket.shift();
      if (next && !seen.has(next.id)) {
        seen.add(next.id);
        chosen.push(next);
        progressed = true;
        if (chosen.length >= count) break;
      }
    }
    if (!progressed) break;
  }
  return chosen;
}

/** Resolve a catalog exercise's relative image paths to full FED URLs. */
export function catalogImageUrls(e: CatalogExercise): string[] {
  return (e.images ?? []).map((p) => `${FED_BASE}/${p}`);
}

/** Default set scheme for an auto-filled exercise in a given focus. */
export function defaultSetsForFocus(focusKey: string): string {
  return getFocusPreset(focusKey)?.cardio ? "20 min" : "3 x 10";
}

export const WEEKDAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const WEEKDAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/** Builder display order: Monday first, Sunday last. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
