/**
 * 6-day workout split — gym + home variants.
 *
 * Each exercise has a `searchQuery` that opens a YouTube search in a new tab.
 *
 * For inline demos, `images` (an array of frame URLs) is preferred over
 * `youtubeId` — frames cycle to produce a lightweight movement loop without
 * any iframe overhead. Two frames (start + end pose) is the typical case.
 * Self-hosted assets under `/public/gifs/*` and remote URLs both work.
 *
 * Frames here come from the free-exercise-db dataset (CC0):
 *   https://github.com/yuhonas/free-exercise-db
 * Each exercise has `0.jpg` (start) and `1.jpg` (end) under its ID folder.
 *
 * Resolution order at render time: images > youtubeId > searchQuery link.
 */

import type { WorkoutMode } from "@/lib/types";

const FED_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

const fed = (id: string): string[] => [
  `${FED_BASE}/${id}/0.jpg`,
  `${FED_BASE}/${id}/1.jpg`,
];

export interface Exercise {
  name: string;
  sets: string;
  note?: string;
  images?: string[];
  youtubeId?: string;
  searchQuery: string;
}

export interface WorkoutDay {
  day: string;
  weekday: string;
  focus: string;
  icon: string;
  color: string;
  duration: string;
  epoc: boolean;
  calNote: string;
  cardio?: string;
  exercises: Exercise[];
}

const sq = (q: string) => `${q} proper form tutorial`;

export const GYM_DAYS: WorkoutDay[] = [
  {
    day: "Day 1",
    weekday: "Wed",
    focus: "Shoulders + Abs",
    icon: "🏋️",
    color: "#38bdf8",
    duration: "~55 min",
    epoc: false,
    calNote: "Shoulder isolation — moderate intensity. Abs add little.",
    exercises: [
      { name: "Seated Shoulder Press", sets: "10, 8, 8, 6", images: fed("Dumbbell_Shoulder_Press"), youtubeId: "fHsKn4iUOhU", searchQuery: sq("Seated Dumbbell Shoulder Press") },
      { name: "DB Lateral Raise", sets: "15, 12, 12, 10", images: fed("Side_Lateral_Raise"), youtubeId: "3VcKaXpzqRo", searchQuery: sq("Dumbbell Lateral Raise") },
      { name: "Reverse Pec Deck", sets: "15, 12, 12, 10", images: fed("Reverse_Flyes"), searchQuery: sq("Reverse Pec Deck rear delt fly") },
      { name: "Upright Row", sets: "10, 10, 8", images: fed("Upright_Barbell_Row"), searchQuery: sq("Barbell Upright Row") },
      { name: "Hanging Leg Raise", sets: "15, 15, 12", images: fed("Hanging_Leg_Raise"), searchQuery: sq("Hanging Leg Raise") },
      { name: "Cable Crunch", sets: "20, 15, 15", images: fed("Cable_Crunch"), searchQuery: sq("Cable Crunch abs") },
    ],
  },
  {
    day: "Day 2",
    weekday: "Thu",
    focus: "Back + Biceps",
    icon: "💪",
    color: "#a78bfa",
    duration: "~60 min",
    epoc: true,
    calNote: "Large back muscles = high burn. EPOC adds 10–15% for hours after.",
    exercises: [
      { name: "Pull-Ups / Lat Pulldown", sets: "12, 10, 10, 8", images: fed("Wide-Grip_Lat_Pulldown"), youtubeId: "O94yEoGXtBY", searchQuery: sq("Lat Pulldown") },
      { name: "Barbell Row", sets: "10, 8, 8, 6", images: fed("Bent_Over_Barbell_Row"), youtubeId: "vT2GjY_Umpw", searchQuery: sq("Barbell Bent Over Row") },
      { name: "Seated Cable Row", sets: "12, 10, 8, 8", images: fed("Seated_Cable_Rows"), searchQuery: sq("Seated Cable Row") },
      { name: "Dumbbell Pullover", sets: "12, 10, 8", images: fed("Straight-Arm_Dumbbell_Pullover"), searchQuery: sq("Dumbbell Pullover lat") },
      { name: "Barbell Curl", sets: "10, 8, 8, 6", images: fed("Barbell_Curl"), searchQuery: sq("Barbell Bicep Curl") },
      { name: "Incline Dumbbell Curl", sets: "12, 10, 8", images: fed("Incline_Dumbbell_Curl"), searchQuery: sq("Incline Dumbbell Curl") },
    ],
  },
  {
    day: "Day 3",
    weekday: "Fri",
    focus: "Chest + Triceps",
    icon: "🫁",
    color: "#f87171",
    duration: "~60 min",
    epoc: true,
    calNote: "Compound pressing is energy-demanding. EPOC afterburn applies.",
    exercises: [
      { name: "Flat Bench Press", sets: "8, 10, 8, 6", images: fed("Barbell_Bench_Press_-_Medium_Grip"), youtubeId: "vthMCtgVtFw", searchQuery: sq("Flat Barbell Bench Press") },
      { name: "Incline Dumbbell Press", sets: "10, 10, 8, 8", images: fed("Incline_Dumbbell_Press"), youtubeId: "8iPEnn-ltC8", searchQuery: sq("Incline Dumbbell Press") },
      { name: "Cable Fly / Pec Deck", sets: "15, 12, 12, 10", images: fed("Cable_Crossover"), searchQuery: sq("Cable Chest Fly") },
      { name: "Tricep Pushdown", sets: "12, 10, 10, 8", images: fed("Triceps_Pushdown"), searchQuery: sq("Tricep Pushdown") },
      { name: "Overhead DB Extension", sets: "12, 10, 8", images: fed("Seated_Triceps_Press"), searchQuery: sq("Overhead Dumbbell Tricep Extension") },
      { name: "Dips", sets: "3 sets to failure", images: fed("Dips_-_Triceps_Version"), searchQuery: sq("Tricep Dips bodyweight") },
    ],
  },
  {
    day: "Day 4",
    weekday: "Sat",
    focus: "Arms",
    icon: "💥",
    color: "#fb923c",
    duration: "~50 min",
    epoc: false,
    calNote: "Isolation exercises use smaller muscles — lowest burn day.",
    exercises: [
      { name: "Close-Grip Bench Press", sets: "10, 8, 8, 6", images: fed("Close-Grip_Barbell_Bench_Press"), searchQuery: sq("Close Grip Bench Press triceps") },
      { name: "Tricep Pushdown", sets: "12, 10, 10, 8", images: fed("Triceps_Pushdown"), searchQuery: sq("Tricep Pushdown") },
      { name: "Skull Crushers", sets: "10, 8, 8", images: fed("EZ-Bar_Skullcrusher"), searchQuery: sq("Skull Crushers EZ bar") },
      { name: "Barbell Curl", sets: "10, 8, 8, 6", images: fed("Barbell_Curl"), searchQuery: sq("Barbell Bicep Curl") },
      { name: "Hammer Curl", sets: "12, 10, 10", images: fed("Hammer_Curls"), searchQuery: sq("Dumbbell Hammer Curl") },
      { name: "Preacher Curl", sets: "12, 10, 8", images: fed("Preacher_Curl"), searchQuery: sq("Preacher Curl bicep") },
    ],
  },
  {
    day: "Day 5",
    weekday: "Sun",
    focus: "Legs",
    icon: "🦵",
    color: "#4ade80",
    duration: "~65 min",
    epoc: true,
    calNote:
      "Highest burn — squats, lunges & RDLs crush your biggest muscles. EPOC adds 10–15% after.",
    exercises: [
      { name: "Barbell Squat / Leg Press", sets: "10, 8, 8, 6", images: fed("Barbell_Squat"), youtubeId: "bEv6CCg2BC8", searchQuery: sq("Barbell Back Squat") },
      { name: "Walking Lunges", sets: "12 each leg x 3", images: fed("Dumbbell_Lunges"), searchQuery: sq("Walking Dumbbell Lunges") },
      { name: "Leg Extension", sets: "15, 12, 10, 10", images: fed("Leg_Extensions"), searchQuery: sq("Leg Extension machine") },
      { name: "Lying Leg Curl", sets: "12, 10, 10, 8", images: fed("Lying_Leg_Curls"), searchQuery: sq("Lying Leg Curl hamstring") },
      { name: "Romanian Deadlift", sets: "10, 8, 8", images: fed("Romanian_Deadlift"), youtubeId: "5zmlnbWb-g4", searchQuery: sq("Romanian Deadlift RDL barbell") },
      { name: "Standing Calf Raise", sets: "20, 15, 15", images: fed("Standing_Calf_Raises"), searchQuery: sq("Standing Calf Raise") },
    ],
  },
  {
    day: "Day 6",
    weekday: "Mon",
    focus: "Cardio",
    icon: "🚶",
    color: "#fbbf24",
    duration: "30–45 min",
    epoc: false,
    calNote: "Steady incline walk. HIIT burns extra + afterburn on top.",
    exercises: [
      { name: "Incline Walk / Treadmill", sets: "30–45 mins", note: "Zone 2 pace", searchQuery: sq("Incline Treadmill Walk fat burn") },
    ],
  },
];

export const HOME_DAYS: WorkoutDay[] = [
  {
    day: "Day 1", weekday: "Wed", focus: "Shoulders + Abs", icon: "🏋️", color: "#38bdf8",
    duration: "~55 min", epoc: false,
    cardio: "10–15 min bike · +80–110 cal",
    calNote: "Shoulder isolation — moderate intensity.",
    exercises: [
      { name: "DB Seated Shoulder Press", sets: "10, 8, 8, 6", note: "Bench upright", images: fed("Dumbbell_Shoulder_Press"), searchQuery: sq("Dumbbell Seated Shoulder Press") },
      { name: "DB Lateral Raise", sets: "15, 12, 12, 10", note: "Slow & controlled", images: fed("Side_Lateral_Raise"), youtubeId: "3VcKaXpzqRo", searchQuery: sq("Dumbbell Lateral Raise") },
      { name: "DB Front Raise", sets: "15, 12, 12, 10", note: "Replaces Pec Deck", images: fed("Front_Dumbbell_Raise"), searchQuery: sq("Dumbbell Front Raise shoulder") },
      { name: "DB Upright Row", sets: "10, 10, 8", note: "Wide grip", images: fed("Dumbbell_One-Arm_Upright_Row"), searchQuery: sq("Dumbbell Upright Row") },
      { name: "Lying Leg Raise", sets: "15, 15, 12", note: "Bench or floor", images: fed("Flat_Bench_Lying_Leg_Raise"), searchQuery: sq("Lying Leg Raise abs") },
      { name: "DB Weighted Crunch", sets: "20, 15, 15", note: "DB on chest", images: fed("Weighted_Crunches"), searchQuery: sq("Weighted Crunch dumbbell") },
    ],
  },
  {
    day: "Day 2", weekday: "Thu", focus: "Back + Biceps", icon: "💪", color: "#a78bfa",
    duration: "~60 min", epoc: true,
    cardio: "10–15 min bike · +80–110 cal",
    calNote: "Large back muscles = high burn. EPOC adds 10–15% after.",
    exercises: [
      { name: "DB Bent-Over Row", sets: "12, 10, 10, 8", note: "Replaces Lat Pulldown", images: fed("Bent_Over_Two-Dumbbell_Row"), searchQuery: sq("Dumbbell Bent Over Row") },
      { name: "Single-Arm DB Row", sets: "10, 8, 8, 6", note: "Brace on bench", images: fed("One-Arm_Dumbbell_Row"), searchQuery: sq("Single Arm Dumbbell Row") },
      { name: "DB Seal Row", sets: "12, 10, 8, 8", note: "Face down on bench", images: fed("Bent_Over_Two-Dumbbell_Row"), searchQuery: sq("Dumbbell Seal Row chest supported") },
      { name: "DB Pullover", sets: "12, 10, 8", note: "Full stretch", images: fed("Straight-Arm_Dumbbell_Pullover"), searchQuery: sq("Dumbbell Pullover") },
      { name: "DB Bicep Curl", sets: "10, 8, 8, 6", note: "Slow eccentric", images: fed("Dumbbell_Bicep_Curl"), searchQuery: sq("Dumbbell Bicep Curl") },
      { name: "Incline DB Curl", sets: "12, 10, 8", note: "Bench at 45°", images: fed("Incline_Dumbbell_Curl"), searchQuery: sq("Incline Dumbbell Curl") },
    ],
  },
  {
    day: "Day 3", weekday: "Fri", focus: "Chest + Triceps", icon: "🫁", color: "#f87171",
    duration: "~60 min", epoc: true,
    cardio: "10–15 min bike · +80–110 cal",
    calNote: "DB pressing and compound movements are energy-demanding.",
    exercises: [
      { name: "DB Flat Bench Press", sets: "8, 10, 8, 6", note: "Full ROM", images: fed("Dumbbell_Bench_Press"), youtubeId: "SHsUIZiNdeY", searchQuery: sq("Dumbbell Flat Bench Press") },
      { name: "DB Incline Bench Press", sets: "10, 10, 8, 8", note: "30–45° angle", images: fed("Incline_Dumbbell_Press"), youtubeId: "8iPEnn-ltC8", searchQuery: sq("Incline Dumbbell Bench Press") },
      { name: "DB Chest Fly", sets: "15, 12, 12, 10", note: "Replaces Cable Fly", images: fed("Dumbbell_Flyes"), searchQuery: sq("Dumbbell Chest Fly") },
      { name: "DB Tricep Kickback", sets: "12, 10, 10, 8", note: "Replaces Pushdown", images: fed("Tricep_Dumbbell_Kickback"), searchQuery: sq("Dumbbell Tricep Kickback") },
      { name: "DB Overhead Tricep Extension", sets: "12, 10, 8", note: "Both hands on DB", images: fed("Seated_Triceps_Press"), searchQuery: sq("Overhead Dumbbell Tricep Extension") },
      { name: "Diamond Push-Ups", sets: "3 sets to failure", note: "Replaces Dips", images: fed("Pushups_Close_and_Wide_Hand_Positions"), searchQuery: sq("Diamond Push Ups triceps") },
    ],
  },
  {
    day: "Day 4", weekday: "Sat", focus: "Arms", icon: "💥", color: "#fb923c",
    duration: "~50 min", epoc: false,
    cardio: "10–15 min bike · +80–110 cal",
    calNote: "Isolation exercises — lowest burn day.",
    exercises: [
      { name: "Close-Grip DB Press", sets: "10, 8, 8, 6", note: "Elbows tucked", images: fed("Dumbbell_Bench_Press"), searchQuery: sq("Close Grip Dumbbell Press triceps") },
      { name: "DB Tricep Kickback", sets: "12, 10, 10, 8", note: "Hinge at hips", images: fed("Tricep_Dumbbell_Kickback"), searchQuery: sq("Dumbbell Tricep Kickback") },
      { name: "DB Skull Crushers", sets: "10, 8, 8", note: "Lower to forehead", images: fed("Lying_Dumbbell_Tricep_Extension"), searchQuery: sq("Dumbbell Skull Crushers") },
      { name: "DB Bicep Curl", sets: "10, 8, 8, 6", note: "Supinate at top", images: fed("Dumbbell_Bicep_Curl"), searchQuery: sq("Dumbbell Bicep Curl") },
      { name: "DB Hammer Curl", sets: "12, 10, 10", note: "Neutral grip", images: fed("Hammer_Curls"), searchQuery: sq("Dumbbell Hammer Curl") },
      { name: "DB Concentration Curl", sets: "12, 10, 8", note: "Elbow on knee", images: fed("Concentration_Curls"), searchQuery: sq("Dumbbell Concentration Curl") },
    ],
  },
  {
    day: "Day 5", weekday: "Sun", focus: "Legs", icon: "🦵", color: "#4ade80",
    duration: "~65 min", epoc: true,
    cardio: "15–20 min bike · +100–140 cal",
    calNote: "Highest burn — goblet squats, lunges & RDLs. EPOC adds 10–15% after.",
    exercises: [
      { name: "DB Goblet Squat", sets: "10, 8, 8, 6", note: "Replaces Barbell Squat", images: fed("Goblet_Squat"), youtubeId: "MeIiIdhvXT4", searchQuery: sq("Goblet Squat dumbbell") },
      { name: "DB Walking Lunges", sets: "12 each leg x 3", note: "DBs at sides", images: fed("Dumbbell_Lunges"), searchQuery: sq("Dumbbell Walking Lunges") },
      { name: "DB Bulgarian Split Squat", sets: "15, 12, 10, 10", note: "Rear foot on bench", images: fed("Split_Squat_with_Dumbbells"), searchQuery: sq("Bulgarian Split Squat dumbbell") },
      { name: "DB Romanian Deadlift", sets: "12, 10, 10, 8", note: "Feel hamstring stretch", images: fed("Romanian_Deadlift"), searchQuery: sq("Dumbbell Romanian Deadlift") },
      { name: "DB Stiff-Leg Deadlift", sets: "10, 8, 8", note: "Replaces Leg Curl", images: fed("Stiff-Legged_Dumbbell_Deadlift"), searchQuery: sq("Dumbbell Stiff Leg Deadlift hamstring") },
      { name: "Single-Leg Calf Raise", sets: "20, 15, 15", note: "Slow & full range", images: fed("Dumbbell_Seated_One-Leg_Calf_Raise"), searchQuery: sq("Single Leg Calf Raise") },
    ],
  },
  {
    day: "Day 6", weekday: "Mon", focus: "Cardio", icon: "🚴", color: "#fbbf24",
    duration: "30–45 min", epoc: false,
    calNote: "Steady state: 320–400 cal. HIIT (20 min): 250–320 + afterburn.",
    exercises: [
      { name: "Bike — Steady State", sets: "30–45 min", note: "Zone 2 heart rate", searchQuery: sq("Indoor Bike Zone 2 Steady State Cardio") },
      { name: "Bike — HIIT", sets: "20 min", note: "30s hard / 90s easy × 8", searchQuery: sq("Indoor Bike HIIT 30 seconds on 90 off") },
    ],
  },
];

export function getDays(mode: WorkoutMode): WorkoutDay[] {
  return mode === "gym" ? GYM_DAYS : HOME_DAYS;
}

export interface WellnessRoutine {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  color: string;
  images?: string[];
  youtubeId: string;
}

export const WELLNESS_ROUTINES: WellnessRoutine[] = [
  {
    id: "warm-up",
    title: "Warm Up",
    description:
      "Dynamic full-body activation before any workout. Raises heart rate, loosens joints and primes muscles to prevent injury.",
    duration: "10 min",
    icon: "🔥",
    color: "#fb923c",
    youtubeId: "oT6NWL7xPbk",
  },
  {
    id: "core",
    title: "Core",
    description:
      "No-equipment beginner core routine targeting abs, obliques and lower back. Builds a stable foundation for every lift.",
    duration: "10 min",
    icon: "💪",
    color: "#4ade80",
    youtubeId: "b_TTLmmQmXU",
  },
  {
    id: "stretch",
    title: "Stretches",
    description:
      "Full-body flexibility routine to loosen tight muscles, improve range of motion and speed up recovery after training.",
    duration: "10 min",
    icon: "🧘",
    color: "#38bdf8",
    youtubeId: "VjRyuPpT0Es",
  },
  {
    id: "meditation",
    title: "Meditation",
    description:
      "Guided breathwork and mindfulness session to reduce stress, sharpen focus and support sleep quality and recovery.",
    duration: "10 min",
    icon: "🌿",
    color: "#a78bfa",
    youtubeId: "U9YKY7fdwyg",
  },
];
