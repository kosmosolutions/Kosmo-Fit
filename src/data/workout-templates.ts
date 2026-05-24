/**
 * Workout plan templates — pre-built programs users can swap into.
 *
 * Each template defines a full 6-slot weekly rotation. Slots with no
 * exercises are treated as rest days by the renderer. This keeps the
 * existing calc / burns / day-picker system unchanged.
 *
 * The "custom-6day" template is the original GYM_DAYS / HOME_DAYS split
 * (re-exported so the picker can present it as a tile). Existing users
 * get this as their active template at migration time.
 */

import {
  GYM_DAYS,
  HOME_DAYS,
  type Exercise,
  type WorkoutDay,
} from "./workouts";
import type { WorkoutMode } from "@/lib/types";

const FED_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

const fed = (id: string): string[] => [
  `${FED_BASE}/${id}/0.jpg`,
  `${FED_BASE}/${id}/1.jpg`,
];

const sq = (q: string) => `${q} proper form tutorial`;

const REST: WorkoutDay = {
  day: "Rest",
  weekday: "—",
  focus: "Rest",
  icon: "😴",
  color: "#64748b",
  duration: "—",
  epoc: false,
  calNote: "Recovery day. Sleep, hydrate, light walking.",
  exercises: [],
};

export interface TemplateBadge {
  label: string;
  tone: "cyan" | "violet" | "amber" | "green" | "rose";
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  // Lucide icon name, rendered in the card hero. Keeps the catalog
  // dependency-free; the picker maps name → component.
  icon: string;
  // Two-stop gradient used as the hero background.
  gradient: { from: string; to: string };
  // Accent color used for badges and active-tile rings.
  accent: string;
  dayCount: number;
  level: "beginner" | "intermediate" | "advanced" | "all";
  equipment: "bodyweight" | "minimal" | "dumbbells" | "barbell" | "any";
  badges: TemplateBadge[];
  // Days are 6 slots. Rest days are filled with REST.
  days: { home: WorkoutDay[]; gym: WorkoutDay[] };
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom 6-day — the original split (preserved as a template tile).
// ─────────────────────────────────────────────────────────────────────────────

const CUSTOM_6DAY: WorkoutTemplate = {
  id: "custom-6day",
  name: "Custom 6-Day",
  tagline: "Your original split",
  description:
    "The classic 6-day body-part split you started with — Shoulders, Back, Chest, Arms, Legs, Cardio. Fully customizable.",
  icon: "Sparkles",
  gradient: { from: "#22d3ee", to: "#a78bfa" },
  accent: "#22d3ee",
  dayCount: 6,
  level: "intermediate",
  equipment: "any",
  badges: [
    { label: "Body-part split", tone: "cyan" },
    { label: "6 days", tone: "violet" },
  ],
  days: { home: HOME_DAYS, gym: GYM_DAYS },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3-Day Full Body — beginner-friendly, three full sessions per week.
// ─────────────────────────────────────────────────────────────────────────────

const ex = (
  name: string,
  sets: string,
  imageId: string,
  query?: string,
  note?: string,
): Exercise => ({
  name,
  sets,
  images: fed(imageId),
  searchQuery: sq(query ?? name),
  ...(note ? { note } : {}),
});

const FB_GYM: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Full Body A",
    icon: "💪",
    color: "#22d3ee",
    duration: "~55 min",
    epoc: true,
    calNote: "Compound-heavy full-body. Big lifts, big burn.",
    exercises: [
      ex("Barbell Squat", "5, 5, 5", "Barbell_Squat"),
      ex("Bench Press", "5, 5, 5", "Barbell_Bench_Press_-_Medium_Grip"),
      ex("Bent-Over Row", "5, 5, 5", "Bent_Over_Barbell_Row"),
      ex("Overhead Press", "3 x 8", "Standing_Military_Press"),
      ex("Plank", "3 x 45s", "Plank"),
    ],
  },
  REST,
  {
    day: "Day 2",
    weekday: "Wed",
    focus: "Full Body B",
    icon: "🏋️",
    color: "#a78bfa",
    duration: "~55 min",
    epoc: true,
    calNote: "Deadlift day — full posterior chain.",
    exercises: [
      ex("Deadlift", "5, 5, 3", "Barbell_Deadlift"),
      ex("Incline DB Press", "3 x 10", "Incline_Dumbbell_Press"),
      ex("Pull-Ups", "3 to failure", "Pullups"),
      ex("Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  },
  REST,
  {
    day: "Day 3",
    weekday: "Fri",
    focus: "Full Body C",
    icon: "🦵",
    color: "#f87171",
    duration: "~55 min",
    epoc: true,
    calNote: "Front-squat focus + accessory volume.",
    exercises: [
      ex("Front Squat", "4 x 6", "Front_Barbell_Squat"),
      ex("Romanian Deadlift", "4 x 8", "Romanian_Deadlift"),
      ex("Dumbbell Shoulder Press", "3 x 10", "Dumbbell_Shoulder_Press"),
      ex("Seated Cable Row", "3 x 10", "Seated_Cable_Rows"),
      ex("Barbell Curl", "3 x 10", "Barbell_Curl"),
    ],
  },
  REST,
];

const FB_HOME: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Full Body A",
    icon: "💪",
    color: "#22d3ee",
    duration: "~50 min",
    epoc: true,
    calNote: "Dumbbell + bodyweight full-body session.",
    exercises: [
      ex("DB Goblet Squat", "4 x 10", "Goblet_Squat"),
      ex("DB Flat Bench Press", "4 x 8", "Dumbbell_Bench_Press"),
      ex("DB Bent-Over Row", "4 x 10", "Bent_Over_Two-Dumbbell_Row"),
      ex("DB Shoulder Press", "3 x 10", "Dumbbell_Shoulder_Press"),
      ex("Plank", "3 x 45s", "Plank"),
    ],
  },
  REST,
  {
    day: "Day 2",
    weekday: "Wed",
    focus: "Full Body B",
    icon: "🏋️",
    color: "#a78bfa",
    duration: "~50 min",
    epoc: true,
    calNote: "Hinge-focused — RDLs and rows.",
    exercises: [
      ex("DB Romanian Deadlift", "4 x 10", "Romanian_Deadlift"),
      ex("DB Incline Bench Press", "3 x 10", "Incline_Dumbbell_Press"),
      ex("Single-Arm DB Row", "3 x 10/side", "One-Arm_Dumbbell_Row"),
      ex("DB Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  },
  REST,
  {
    day: "Day 3",
    weekday: "Fri",
    focus: "Full Body C",
    icon: "🦵",
    color: "#f87171",
    duration: "~50 min",
    epoc: true,
    calNote: "Split-squat focus + arms.",
    exercises: [
      ex("DB Bulgarian Split Squat", "4 x 8/leg", "Split_Squat_with_Dumbbells"),
      ex("DB Stiff-Leg Deadlift", "3 x 10", "Stiff-Legged_Dumbbell_Deadlift"),
      ex("DB Lateral Raise", "3 x 12", "Side_Lateral_Raise"),
      ex("DB Bicep Curl", "3 x 10", "Dumbbell_Bicep_Curl"),
      ex("Diamond Push-Ups", "3 to failure", "Pushups_Close_and_Wide_Hand_Positions"),
    ],
  },
  REST,
];

const FULLBODY_3DAY: WorkoutTemplate = {
  id: "fullbody-3day",
  name: "3-Day Full Body",
  tagline: "Build the basics",
  description:
    "Three full-body sessions per week. Hits every muscle group with the biggest, most efficient lifts. Ideal for beginners or anyone short on time.",
  icon: "Dumbbell",
  gradient: { from: "#4ade80", to: "#22d3ee" },
  accent: "#4ade80",
  dayCount: 3,
  level: "beginner",
  equipment: "any",
  badges: [
    { label: "Beginner-friendly", tone: "green" },
    { label: "3 days", tone: "cyan" },
  ],
  days: { home: FB_HOME, gym: FB_GYM },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4-Day Upper/Lower
// ─────────────────────────────────────────────────────────────────────────────

const UL_GYM: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Upper A",
    icon: "💪",
    color: "#38bdf8",
    duration: "~60 min",
    epoc: true,
    calNote: "Heavy press + row. Builds upper-body strength.",
    exercises: [
      ex("Bench Press", "4 x 6", "Barbell_Bench_Press_-_Medium_Grip"),
      ex("Bent-Over Row", "4 x 8", "Bent_Over_Barbell_Row"),
      ex("Overhead Press", "3 x 8", "Standing_Military_Press"),
      ex("Pull-Ups / Lat Pulldown", "3 x 10", "Wide-Grip_Lat_Pulldown"),
      ex("Barbell Curl", "3 x 10", "Barbell_Curl"),
      ex("Tricep Pushdown", "3 x 12", "Triceps_Pushdown"),
    ],
  },
  {
    day: "Day 2",
    weekday: "Tue",
    focus: "Lower A",
    icon: "🦵",
    color: "#4ade80",
    duration: "~55 min",
    epoc: true,
    calNote: "Squat focus + posterior chain.",
    exercises: [
      ex("Barbell Squat", "4 x 6", "Barbell_Squat"),
      ex("Romanian Deadlift", "4 x 8", "Romanian_Deadlift"),
      ex("Leg Press", "3 x 10", "Leg_Press"),
      ex("Lying Leg Curl", "3 x 12", "Lying_Leg_Curls"),
      ex("Standing Calf Raise", "4 x 15", "Standing_Calf_Raises"),
    ],
  },
  REST,
  {
    day: "Day 3",
    weekday: "Thu",
    focus: "Upper B",
    icon: "🏋️",
    color: "#a78bfa",
    duration: "~60 min",
    epoc: true,
    calNote: "Hypertrophy upper — more volume, less load.",
    exercises: [
      ex("Incline Dumbbell Press", "4 x 10", "Incline_Dumbbell_Press"),
      ex("Seated Cable Row", "4 x 10", "Seated_Cable_Rows"),
      ex("Dumbbell Shoulder Press", "3 x 10", "Dumbbell_Shoulder_Press"),
      ex("Lat Pulldown", "3 x 12", "Wide-Grip_Lat_Pulldown"),
      ex("DB Lateral Raise", "3 x 15", "Side_Lateral_Raise"),
      ex("Hammer Curl", "3 x 12", "Hammer_Curls"),
    ],
  },
  {
    day: "Day 4",
    weekday: "Fri",
    focus: "Lower B",
    icon: "🔥",
    color: "#fb923c",
    duration: "~55 min",
    epoc: true,
    calNote: "Deadlift focus + leg accessories.",
    exercises: [
      ex("Deadlift", "5, 3, 3", "Barbell_Deadlift"),
      ex("Front Squat", "3 x 8", "Front_Barbell_Squat"),
      ex("Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("Leg Extension", "3 x 12", "Leg_Extensions"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  },
  REST,
  REST,
];

const UL_HOME: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Upper A",
    icon: "💪",
    color: "#38bdf8",
    duration: "~55 min",
    epoc: true,
    calNote: "DB-based heavy upper-body session.",
    exercises: [
      ex("DB Flat Bench Press", "4 x 8", "Dumbbell_Bench_Press"),
      ex("DB Bent-Over Row", "4 x 10", "Bent_Over_Two-Dumbbell_Row"),
      ex("DB Shoulder Press", "3 x 10", "Dumbbell_Shoulder_Press"),
      ex("Pull-Ups (or DB Pullover)", "3 x 8", "Pullups"),
      ex("DB Bicep Curl", "3 x 10", "Dumbbell_Bicep_Curl"),
      ex("DB Tricep Kickback", "3 x 12", "Tricep_Dumbbell_Kickback"),
    ],
  },
  {
    day: "Day 2",
    weekday: "Tue",
    focus: "Lower A",
    icon: "🦵",
    color: "#4ade80",
    duration: "~50 min",
    epoc: true,
    calNote: "Goblet squats + hinge.",
    exercises: [
      ex("DB Goblet Squat", "4 x 10", "Goblet_Squat"),
      ex("DB Romanian Deadlift", "4 x 10", "Romanian_Deadlift"),
      ex("DB Bulgarian Split Squat", "3 x 8/leg", "Split_Squat_with_Dumbbells"),
      ex("DB Stiff-Leg Deadlift", "3 x 10", "Stiff-Legged_Dumbbell_Deadlift"),
      ex("Single-Leg Calf Raise", "3 x 15", "Dumbbell_Seated_One-Leg_Calf_Raise"),
    ],
  },
  REST,
  {
    day: "Day 3",
    weekday: "Thu",
    focus: "Upper B",
    icon: "🏋️",
    color: "#a78bfa",
    duration: "~55 min",
    epoc: true,
    calNote: "Higher rep hypertrophy upper.",
    exercises: [
      ex("DB Incline Bench Press", "4 x 10", "Incline_Dumbbell_Press"),
      ex("Single-Arm DB Row", "4 x 10/side", "One-Arm_Dumbbell_Row"),
      ex("DB Lateral Raise", "3 x 15", "Side_Lateral_Raise"),
      ex("DB Chest Fly", "3 x 12", "Dumbbell_Flyes"),
      ex("Hammer Curl", "3 x 12", "Hammer_Curls"),
      ex("Diamond Push-Ups", "3 to failure", "Pushups_Close_and_Wide_Hand_Positions"),
    ],
  },
  {
    day: "Day 4",
    weekday: "Fri",
    focus: "Lower B",
    icon: "🔥",
    color: "#fb923c",
    duration: "~50 min",
    epoc: true,
    calNote: "Lunge-and-hinge focused lower.",
    exercises: [
      ex("DB Walking Lunges", "4 x 10/leg", "Dumbbell_Lunges"),
      ex("DB Romanian Deadlift", "4 x 10", "Romanian_Deadlift"),
      ex("DB Goblet Squat", "3 x 12", "Goblet_Squat"),
      ex("Glute Bridge", "3 x 15", "Glute_Bridge"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  },
  REST,
  REST,
];

const UPPERLOWER_4DAY: WorkoutTemplate = {
  id: "upperlower-4day",
  name: "4-Day Upper/Lower",
  tagline: "Balanced strength",
  description:
    "Upper/Lower split four times a week. Hits each muscle group twice for steady strength + size gains. Sweet spot for most lifters.",
  icon: "LayoutGrid",
  gradient: { from: "#38bdf8", to: "#a78bfa" },
  accent: "#38bdf8",
  dayCount: 4,
  level: "intermediate",
  equipment: "any",
  badges: [
    { label: "Intermediate", tone: "cyan" },
    { label: "4 days", tone: "violet" },
  ],
  days: { home: UL_HOME, gym: UL_GYM },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5-Day PPL + Upper/Lower
// ─────────────────────────────────────────────────────────────────────────────

const PPLUL_GYM: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Push",
    icon: "🫁",
    color: "#f87171",
    duration: "~60 min",
    epoc: true,
    calNote: "Chest, shoulders, triceps.",
    exercises: [
      ex("Bench Press", "4 x 8", "Barbell_Bench_Press_-_Medium_Grip"),
      ex("Incline DB Press", "3 x 10", "Incline_Dumbbell_Press"),
      ex("Overhead Press", "3 x 8", "Standing_Military_Press"),
      ex("DB Lateral Raise", "3 x 15", "Side_Lateral_Raise"),
      ex("Tricep Pushdown", "3 x 12", "Triceps_Pushdown"),
    ],
  },
  {
    day: "Day 2",
    weekday: "Tue",
    focus: "Pull",
    icon: "💪",
    color: "#a78bfa",
    duration: "~60 min",
    epoc: true,
    calNote: "Back + biceps.",
    exercises: [
      ex("Deadlift", "4 x 5", "Barbell_Deadlift"),
      ex("Pull-Ups / Lat Pulldown", "4 x 8", "Wide-Grip_Lat_Pulldown"),
      ex("Barbell Row", "3 x 10", "Bent_Over_Barbell_Row"),
      ex("Face Pull", "3 x 15", "Face_Pull"),
      ex("Barbell Curl", "3 x 10", "Barbell_Curl"),
    ],
  },
  {
    day: "Day 3",
    weekday: "Wed",
    focus: "Legs",
    icon: "🦵",
    color: "#4ade80",
    duration: "~60 min",
    epoc: true,
    calNote: "Quads + hamstrings + glutes.",
    exercises: [
      ex("Barbell Squat", "4 x 6", "Barbell_Squat"),
      ex("Romanian Deadlift", "3 x 8", "Romanian_Deadlift"),
      ex("Leg Press", "3 x 10", "Leg_Press"),
      ex("Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("Standing Calf Raise", "4 x 15", "Standing_Calf_Raises"),
    ],
  },
  REST,
  {
    day: "Day 4",
    weekday: "Fri",
    focus: "Upper",
    icon: "💪",
    color: "#38bdf8",
    duration: "~55 min",
    epoc: true,
    calNote: "Volume upper-body — chest, back, arms.",
    exercises: [
      ex("Incline Bench Press", "4 x 8", "Incline_Dumbbell_Press"),
      ex("Seated Cable Row", "4 x 10", "Seated_Cable_Rows"),
      ex("DB Shoulder Press", "3 x 10", "Dumbbell_Shoulder_Press"),
      ex("Hammer Curl", "3 x 12", "Hammer_Curls"),
      ex("Skull Crushers", "3 x 10", "EZ-Bar_Skullcrusher"),
    ],
  },
  {
    day: "Day 5",
    weekday: "Sat",
    focus: "Lower",
    icon: "🔥",
    color: "#fb923c",
    duration: "~55 min",
    epoc: true,
    calNote: "Hinge-focused lower with accessories.",
    exercises: [
      ex("Front Squat", "4 x 6", "Front_Barbell_Squat"),
      ex("Romanian Deadlift", "3 x 10", "Romanian_Deadlift"),
      ex("Bulgarian Split Squat", "3 x 8/leg", "Split_Squat_with_Dumbbells"),
      ex("Leg Curl", "3 x 12", "Lying_Leg_Curls"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  },
  REST,
];

const PPLUL_HOME: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Push",
    icon: "🫁",
    color: "#f87171",
    duration: "~55 min",
    epoc: true,
    calNote: "DB push — chest, shoulders, triceps.",
    exercises: [
      ex("DB Flat Bench Press", "4 x 8", "Dumbbell_Bench_Press"),
      ex("DB Incline Bench Press", "3 x 10", "Incline_Dumbbell_Press"),
      ex("DB Shoulder Press", "3 x 10", "Dumbbell_Shoulder_Press"),
      ex("DB Lateral Raise", "3 x 15", "Side_Lateral_Raise"),
      ex("DB Tricep Kickback", "3 x 12", "Tricep_Dumbbell_Kickback"),
    ],
  },
  {
    day: "Day 2",
    weekday: "Tue",
    focus: "Pull",
    icon: "💪",
    color: "#a78bfa",
    duration: "~55 min",
    epoc: true,
    calNote: "Back + biceps with DBs.",
    exercises: [
      ex("DB Romanian Deadlift", "4 x 8", "Romanian_Deadlift"),
      ex("Single-Arm DB Row", "4 x 10/side", "One-Arm_Dumbbell_Row"),
      ex("DB Bent-Over Row", "3 x 10", "Bent_Over_Two-Dumbbell_Row"),
      ex("DB Pullover", "3 x 10", "Straight-Arm_Dumbbell_Pullover"),
      ex("DB Bicep Curl", "3 x 10", "Dumbbell_Bicep_Curl"),
    ],
  },
  {
    day: "Day 3",
    weekday: "Wed",
    focus: "Legs",
    icon: "🦵",
    color: "#4ade80",
    duration: "~55 min",
    epoc: true,
    calNote: "Goblet + lunge + hinge.",
    exercises: [
      ex("DB Goblet Squat", "4 x 10", "Goblet_Squat"),
      ex("DB Romanian Deadlift", "3 x 10", "Romanian_Deadlift"),
      ex("DB Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("DB Bulgarian Split Squat", "3 x 8/leg", "Split_Squat_with_Dumbbells"),
      ex("Single-Leg Calf Raise", "3 x 15", "Dumbbell_Seated_One-Leg_Calf_Raise"),
    ],
  },
  REST,
  {
    day: "Day 4",
    weekday: "Fri",
    focus: "Upper",
    icon: "💪",
    color: "#38bdf8",
    duration: "~50 min",
    epoc: true,
    calNote: "DB volume upper.",
    exercises: [
      ex("DB Incline Bench Press", "4 x 10", "Incline_Dumbbell_Press"),
      ex("DB Bent-Over Row", "4 x 10", "Bent_Over_Two-Dumbbell_Row"),
      ex("DB Front Raise", "3 x 12", "Front_Dumbbell_Raise"),
      ex("Hammer Curl", "3 x 12", "Hammer_Curls"),
      ex("DB Skull Crushers", "3 x 10", "Lying_Dumbbell_Tricep_Extension"),
    ],
  },
  {
    day: "Day 5",
    weekday: "Sat",
    focus: "Lower",
    icon: "🔥",
    color: "#fb923c",
    duration: "~50 min",
    epoc: true,
    calNote: "Lunge-and-hinge lower volume.",
    exercises: [
      ex("DB Goblet Squat", "4 x 10", "Goblet_Squat"),
      ex("DB Stiff-Leg Deadlift", "3 x 10", "Stiff-Legged_Dumbbell_Deadlift"),
      ex("DB Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("Glute Bridge", "3 x 15", "Glute_Bridge"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  },
  REST,
];

const PPL_UL_5DAY: WorkoutTemplate = {
  id: "ppl-upperlower-5day",
  name: "5-Day PPL + UL",
  tagline: "More volume, more growth",
  description:
    "Push/Pull/Legs early in the week, then Upper/Lower to add extra volume. Five days of focused work for serious hypertrophy.",
  icon: "Flame",
  gradient: { from: "#f87171", to: "#fb923c" },
  accent: "#f87171",
  dayCount: 5,
  level: "intermediate",
  equipment: "any",
  badges: [
    { label: "High volume", tone: "rose" },
    { label: "5 days", tone: "amber" },
  ],
  days: { home: PPLUL_HOME, gym: PPLUL_GYM },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6-Day Push/Pull/Legs (classic ×2)
// ─────────────────────────────────────────────────────────────────────────────

const PPL_GYM: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Push (Heavy)",
    icon: "🫁",
    color: "#f87171",
    duration: "~60 min",
    epoc: true,
    calNote: "Strength-focused push day.",
    exercises: [
      ex("Bench Press", "4 x 6", "Barbell_Bench_Press_-_Medium_Grip"),
      ex("Overhead Press", "4 x 6", "Standing_Military_Press"),
      ex("Incline DB Press", "3 x 10", "Incline_Dumbbell_Press"),
      ex("DB Lateral Raise", "3 x 15", "Side_Lateral_Raise"),
      ex("Close-Grip Bench Press", "3 x 10", "Close-Grip_Barbell_Bench_Press"),
    ],
  },
  {
    day: "Day 2",
    weekday: "Tue",
    focus: "Pull (Heavy)",
    icon: "💪",
    color: "#a78bfa",
    duration: "~60 min",
    epoc: true,
    calNote: "Strength-focused pull day.",
    exercises: [
      ex("Deadlift", "4 x 5", "Barbell_Deadlift"),
      ex("Pull-Ups", "4 x 8", "Pullups"),
      ex("Barbell Row", "3 x 8", "Bent_Over_Barbell_Row"),
      ex("Face Pull", "3 x 15", "Face_Pull"),
      ex("Barbell Curl", "3 x 10", "Barbell_Curl"),
    ],
  },
  {
    day: "Day 3",
    weekday: "Wed",
    focus: "Legs (Heavy)",
    icon: "🦵",
    color: "#4ade80",
    duration: "~65 min",
    epoc: true,
    calNote: "Squat-focused leg day.",
    exercises: [
      ex("Barbell Squat", "4 x 6", "Barbell_Squat"),
      ex("Romanian Deadlift", "3 x 8", "Romanian_Deadlift"),
      ex("Leg Press", "3 x 10", "Leg_Press"),
      ex("Lying Leg Curl", "3 x 12", "Lying_Leg_Curls"),
      ex("Standing Calf Raise", "4 x 15", "Standing_Calf_Raises"),
    ],
  },
  {
    day: "Day 4",
    weekday: "Thu",
    focus: "Push (Volume)",
    icon: "🔥",
    color: "#fb923c",
    duration: "~55 min",
    epoc: true,
    calNote: "Higher-rep hypertrophy push.",
    exercises: [
      ex("Incline Bench Press", "4 x 10", "Incline_Dumbbell_Press"),
      ex("DB Shoulder Press", "4 x 10", "Dumbbell_Shoulder_Press"),
      ex("Cable Fly", "3 x 12", "Cable_Crossover"),
      ex("DB Front Raise", "3 x 12", "Front_Dumbbell_Raise"),
      ex("Tricep Pushdown", "3 x 12", "Triceps_Pushdown"),
    ],
  },
  {
    day: "Day 5",
    weekday: "Fri",
    focus: "Pull (Volume)",
    icon: "💪",
    color: "#22d3ee",
    duration: "~55 min",
    epoc: true,
    calNote: "Higher-rep pull for back hypertrophy.",
    exercises: [
      ex("Lat Pulldown", "4 x 10", "Wide-Grip_Lat_Pulldown"),
      ex("Seated Cable Row", "4 x 10", "Seated_Cable_Rows"),
      ex("DB Pullover", "3 x 12", "Straight-Arm_Dumbbell_Pullover"),
      ex("Hammer Curl", "3 x 12", "Hammer_Curls"),
      ex("Incline DB Curl", "3 x 10", "Incline_Dumbbell_Curl"),
    ],
  },
  {
    day: "Day 6",
    weekday: "Sat",
    focus: "Legs (Volume)",
    icon: "🦵",
    color: "#84cc16",
    duration: "~55 min",
    epoc: true,
    calNote: "Lunge-and-curl hypertrophy lower.",
    exercises: [
      ex("Front Squat", "4 x 8", "Front_Barbell_Squat"),
      ex("Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("Leg Extension", "3 x 12", "Leg_Extensions"),
      ex("Glute Bridge", "3 x 15", "Glute_Bridge"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  },
];

const PPL_HOME: WorkoutDay[] = PPL_GYM.map((d, i) => {
  // Home variant — swap barbell lifts for DB equivalents. Keeps the same
  // schedule and focus, just realistic equipment.
  if (i === 0)
    return {
      ...d,
      duration: "~55 min",
      exercises: [
        ex("DB Flat Bench Press", "4 x 8", "Dumbbell_Bench_Press"),
        ex("DB Shoulder Press", "4 x 8", "Dumbbell_Shoulder_Press"),
        ex("DB Incline Bench Press", "3 x 10", "Incline_Dumbbell_Press"),
        ex("DB Lateral Raise", "3 x 15", "Side_Lateral_Raise"),
        ex("Close-Grip DB Press", "3 x 10", "Dumbbell_Bench_Press"),
      ],
    };
  if (i === 1)
    return {
      ...d,
      duration: "~55 min",
      exercises: [
        ex("DB Romanian Deadlift", "4 x 8", "Romanian_Deadlift"),
        ex("Pull-Ups (or DB Pullover)", "4 x 8", "Pullups"),
        ex("DB Bent-Over Row", "3 x 10", "Bent_Over_Two-Dumbbell_Row"),
        ex("DB Reverse Fly", "3 x 15", "Reverse_Flyes"),
        ex("DB Bicep Curl", "3 x 10", "Dumbbell_Bicep_Curl"),
      ],
    };
  if (i === 2)
    return {
      ...d,
      duration: "~60 min",
      exercises: [
        ex("DB Goblet Squat", "4 x 10", "Goblet_Squat"),
        ex("DB Romanian Deadlift", "3 x 10", "Romanian_Deadlift"),
        ex("DB Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
        ex("DB Stiff-Leg Deadlift", "3 x 10", "Stiff-Legged_Dumbbell_Deadlift"),
        ex("Single-Leg Calf Raise", "3 x 15", "Dumbbell_Seated_One-Leg_Calf_Raise"),
      ],
    };
  if (i === 3)
    return {
      ...d,
      duration: "~50 min",
      exercises: [
        ex("DB Incline Bench Press", "4 x 10", "Incline_Dumbbell_Press"),
        ex("DB Shoulder Press", "4 x 10", "Dumbbell_Shoulder_Press"),
        ex("DB Chest Fly", "3 x 12", "Dumbbell_Flyes"),
        ex("DB Front Raise", "3 x 12", "Front_Dumbbell_Raise"),
        ex("DB Tricep Kickback", "3 x 12", "Tricep_Dumbbell_Kickback"),
      ],
    };
  if (i === 4)
    return {
      ...d,
      duration: "~50 min",
      exercises: [
        ex("DB Pullover", "4 x 10", "Straight-Arm_Dumbbell_Pullover"),
        ex("Single-Arm DB Row", "4 x 10/side", "One-Arm_Dumbbell_Row"),
        ex("DB Reverse Fly", "3 x 12", "Reverse_Flyes"),
        ex("Hammer Curl", "3 x 12", "Hammer_Curls"),
        ex("Incline DB Curl", "3 x 10", "Incline_Dumbbell_Curl"),
      ],
    };
  return {
    ...d,
    duration: "~50 min",
    exercises: [
      ex("DB Bulgarian Split Squat", "4 x 8/leg", "Split_Squat_with_Dumbbells"),
      ex("DB Walking Lunges", "3 x 10/leg", "Dumbbell_Lunges"),
      ex("DB Goblet Squat", "3 x 12", "Goblet_Squat"),
      ex("Glute Bridge", "3 x 15", "Glute_Bridge"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
    ],
  };
});

const PPL_6DAY: WorkoutTemplate = {
  id: "ppl-6day",
  name: "6-Day Push/Pull/Legs",
  tagline: "Hit each muscle twice",
  description:
    "Classic PPL rotation twice a week. Heavy day 1, volume day 2. The gold standard for intermediate and advanced lifters who want size + strength.",
  icon: "Repeat",
  gradient: { from: "#a78bfa", to: "#f87171" },
  accent: "#a78bfa",
  dayCount: 6,
  level: "advanced",
  equipment: "any",
  badges: [
    { label: "Advanced", tone: "violet" },
    { label: "6 days", tone: "rose" },
  ],
  days: { home: PPL_HOME, gym: PPL_GYM },
};

// ─────────────────────────────────────────────────────────────────────────────
// HIIT 3-Day — high-intensity interval training, minimal equipment.
// ─────────────────────────────────────────────────────────────────────────────

const HIIT_DAYS: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "HIIT Cardio",
    icon: "🚴",
    color: "#fbbf24",
    duration: "25–30 min",
    epoc: true,
    calNote: "30s hard / 90s easy × 8 rounds. Big EPOC afterburn.",
    cardio: "Bike or rower · ~250–320 cal",
    exercises: [
      ex("Warm-Up Bike", "5 min easy", "Stationary_Bike"),
      ex("Bike HIIT", "30s on / 90s off × 8", "Stationary_Bike", "Bike HIIT 30 seconds on 90 off", "All-out effort on intervals"),
      ex("Cooldown", "5 min easy", "Stationary_Bike"),
    ],
  },
  REST,
  {
    day: "Day 2",
    weekday: "Wed",
    focus: "Full-Body HIIT",
    icon: "🔥",
    color: "#fb923c",
    duration: "25–30 min",
    epoc: true,
    calNote: "AMRAP circuit — 40s work / 20s rest × 5 rounds.",
    exercises: [
      ex("Burpees", "40s work / 20s rest", "Burpees"),
      ex("Jump Squats", "40s work / 20s rest", "Bodyweight_Squat", "Jump squat bodyweight"),
      ex("Push-Ups", "40s work / 20s rest", "Pushups"),
      ex("Mountain Climbers", "40s work / 20s rest", "Mountain_Climbers"),
      ex("Plank to Push-Up", "40s work / 20s rest", "Pushups", "Plank to push up"),
    ],
  },
  REST,
  {
    day: "Day 3",
    weekday: "Fri",
    focus: "Sprint Intervals",
    icon: "⚡",
    color: "#22d3ee",
    duration: "25–30 min",
    epoc: true,
    calNote: "Sprint intervals — fastest fat-burn protocol.",
    cardio: "Treadmill or outdoor · ~280–340 cal",
    exercises: [
      ex("Warm-Up Jog", "5 min easy", "Stationary_Bike", "Easy treadmill jog warm up"),
      ex("Sprints", "20s sprint / 40s walk × 10", "Stationary_Bike", "Treadmill sprint intervals"),
      ex("Cooldown Walk", "5 min", "Stationary_Bike", "Treadmill cooldown walk"),
    ],
  },
  REST,
];

const HIIT_3DAY: WorkoutTemplate = {
  id: "hiit-3day",
  name: "HIIT 3-Day",
  tagline: "Fat-burn afterburner",
  description:
    "Three short, intense interval sessions per week. Builds conditioning and torches calories long after you finish via EPOC.",
  icon: "Zap",
  gradient: { from: "#fbbf24", to: "#fb923c" },
  accent: "#fbbf24",
  dayCount: 3,
  level: "all",
  equipment: "minimal",
  badges: [
    { label: "Fat loss", tone: "amber" },
    { label: "EPOC burn", tone: "rose" },
  ],
  days: { home: HIIT_DAYS, gym: HIIT_DAYS },
};

// ─────────────────────────────────────────────────────────────────────────────
// Compound 5×5 — StrongLifts-style strength program.
// ─────────────────────────────────────────────────────────────────────────────

const C5X5_A: WorkoutDay = {
  day: "Day 1",
  weekday: "Mon",
  focus: "Workout A",
  icon: "🏋️",
  color: "#a78bfa",
  duration: "~45 min",
  epoc: true,
  calNote: "Squat + Bench + Row. Add 5 lbs every session.",
  exercises: [
    ex("Barbell Squat", "5 x 5", "Barbell_Squat"),
    ex("Bench Press", "5 x 5", "Barbell_Bench_Press_-_Medium_Grip"),
    ex("Barbell Row", "5 x 5", "Bent_Over_Barbell_Row"),
  ],
};

const C5X5_B: WorkoutDay = {
  day: "Day 2",
  weekday: "Wed",
  focus: "Workout B",
  icon: "💪",
  color: "#38bdf8",
  duration: "~45 min",
  epoc: true,
  calNote: "Squat + OHP + Deadlift. Deadlift is 1 set of 5.",
  exercises: [
    ex("Barbell Squat", "5 x 5", "Barbell_Squat"),
    ex("Overhead Press", "5 x 5", "Standing_Military_Press"),
    ex("Deadlift", "1 x 5", "Barbell_Deadlift"),
  ],
};

const C5X5_DAYS: WorkoutDay[] = [
  C5X5_A,
  REST,
  C5X5_B,
  REST,
  { ...C5X5_A, day: "Day 3", weekday: "Fri" },
  REST,
  REST,
];

// Home variant — DBs only. Reps shift to compensate for lighter load.
const C5X5_HOME_A: WorkoutDay = {
  ...C5X5_A,
  duration: "~45 min",
  calNote: "DB strength A — heavy goblet, DB bench, DB row.",
  exercises: [
    ex("DB Goblet Squat", "5 x 8", "Goblet_Squat"),
    ex("DB Flat Bench Press", "5 x 5", "Dumbbell_Bench_Press"),
    ex("DB Bent-Over Row", "5 x 5", "Bent_Over_Two-Dumbbell_Row"),
  ],
};

const C5X5_HOME_B: WorkoutDay = {
  ...C5X5_B,
  duration: "~45 min",
  calNote: "DB strength B — split squat, OHP, DB RDL.",
  exercises: [
    ex("DB Bulgarian Split Squat", "5 x 6/leg", "Split_Squat_with_Dumbbells"),
    ex("DB Shoulder Press", "5 x 5", "Dumbbell_Shoulder_Press"),
    ex("DB Romanian Deadlift", "1 x 8", "Romanian_Deadlift"),
  ],
};

const C5X5_HOME_DAYS: WorkoutDay[] = [
  C5X5_HOME_A,
  REST,
  C5X5_HOME_B,
  REST,
  { ...C5X5_HOME_A, day: "Day 3", weekday: "Fri" },
  REST,
  REST,
];

const COMPOUND_5X5: WorkoutTemplate = {
  id: "compound-5x5",
  name: "Compound 5×5",
  tagline: "Pure strength",
  description:
    "Three short sessions per week of the big compound lifts: Squat, Bench, Row, Overhead Press, Deadlift. Add weight every session.",
  icon: "Anchor",
  gradient: { from: "#64748b", to: "#0f172a" },
  accent: "#94a3b8",
  dayCount: 3,
  level: "beginner",
  equipment: "barbell",
  badges: [
    { label: "Strength", tone: "violet" },
    { label: "Progressive overload", tone: "cyan" },
  ],
  days: { home: C5X5_HOME_DAYS, gym: C5X5_DAYS },
};

// ─────────────────────────────────────────────────────────────────────────────
// Calisthenics 4-Day — bodyweight only.
// ─────────────────────────────────────────────────────────────────────────────

const CAL_DAYS: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Mon",
    focus: "Push",
    icon: "🫁",
    color: "#f87171",
    duration: "~45 min",
    epoc: true,
    calNote: "Push-up progressions + dips.",
    exercises: [
      ex("Push-Ups", "4 x AMRAP", "Pushups"),
      ex("Pike Push-Ups", "3 x 10", "Pushups", "Pike push up shoulder"),
      ex("Dips (chair or bars)", "3 x 8", "Dips_-_Triceps_Version"),
      ex("Diamond Push-Ups", "3 x AMRAP", "Pushups_Close_and_Wide_Hand_Positions"),
      ex("Plank", "3 x 60s", "Plank"),
    ],
  },
  {
    day: "Day 2",
    weekday: "Tue",
    focus: "Pull",
    icon: "💪",
    color: "#a78bfa",
    duration: "~45 min",
    epoc: true,
    calNote: "Pull-ups + rows. Use a bar, rings, or doorway bar.",
    exercises: [
      ex("Pull-Ups", "4 x AMRAP", "Pullups"),
      ex("Inverted Row", "3 x 10", "Inverted_Row"),
      ex("Chin-Ups", "3 x 8", "Chin-Up"),
      ex("Hanging Leg Raise", "3 x 12", "Hanging_Leg_Raise"),
      ex("Superman Hold", "3 x 30s", "Superman"),
    ],
  },
  REST,
  {
    day: "Day 3",
    weekday: "Thu",
    focus: "Legs",
    icon: "🦵",
    color: "#4ade80",
    duration: "~45 min",
    epoc: true,
    calNote: "Bodyweight legs — squats, lunges, glute work.",
    exercises: [
      ex("Bodyweight Squats", "4 x 20", "Bodyweight_Squat"),
      ex("Walking Lunges", "3 x 10/leg", "Bodyweight_Walking_Lunge"),
      ex("Bulgarian Split Squat (bw)", "3 x 10/leg", "Split_Squat_with_Dumbbells", "Bodyweight Bulgarian split squat"),
      ex("Glute Bridge", "3 x 15", "Glute_Bridge"),
      ex("Calf Raises (bw)", "3 x 25", "Standing_Calf_Raises", "Bodyweight calf raises"),
    ],
  },
  {
    day: "Day 4",
    weekday: "Fri",
    focus: "Core + Mobility",
    icon: "🧘",
    color: "#38bdf8",
    duration: "~35 min",
    epoc: false,
    calNote: "Core circuit + mobility work.",
    exercises: [
      ex("Hollow Body Hold", "3 x 30s", "Plank", "Hollow body hold core"),
      ex("L-Sit Hold", "3 x 20s", "Hanging_Leg_Raise", "L sit hold progression"),
      ex("Mountain Climbers", "3 x 40s", "Mountain_Climbers"),
      ex("Plank Variations", "3 x 45s", "Plank"),
      ex("Cobra Stretch", "3 x 30s", "Pushups", "Cobra stretch mobility"),
    ],
  },
  REST,
  REST,
];

const CALISTHENICS_4DAY: WorkoutTemplate = {
  id: "calisthenics-4day",
  name: "Calisthenics 4-Day",
  tagline: "All bodyweight",
  description:
    "No equipment needed (a pull-up bar helps). Build strength, control, and mobility using just your bodyweight.",
  icon: "PersonStanding",
  gradient: { from: "#4ade80", to: "#84cc16" },
  accent: "#4ade80",
  dayCount: 4,
  level: "all",
  equipment: "bodyweight",
  badges: [
    { label: "Bodyweight", tone: "green" },
    { label: "No equipment", tone: "cyan" },
  ],
  days: { home: CAL_DAYS, gym: CAL_DAYS },
};

// ─────────────────────────────────────────────────────────────────────────────
// Catalog
// ─────────────────────────────────────────────────────────────────────────────

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  CUSTOM_6DAY,
  FULLBODY_3DAY,
  UPPERLOWER_4DAY,
  PPL_UL_5DAY,
  PPL_6DAY,
  HIIT_3DAY,
  COMPOUND_5X5,
  CALISTHENICS_4DAY,
];

export function getTemplate(id: string): WorkoutTemplate | undefined {
  return WORKOUT_TEMPLATES.find((t) => t.id === id);
}

export function templateDays(
  id: string,
  mode: WorkoutMode,
): WorkoutDay[] | null {
  const t = getTemplate(id);
  if (!t) return null;
  return t.days[mode];
}
