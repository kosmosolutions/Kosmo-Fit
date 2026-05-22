/**
 * 6-day workout split — gym + home variants.
 *
 * Each exercise has a `searchQuery` that opens a YouTube search in a new tab.
 * To embed a specific video inline, set `youtubeId` to a YouTube video ID
 * (the part after `?v=` in a YouTube URL). Example:
 *
 *   { name: "Flat Bench Press", sets: "8, 10, 8, 6",
 *     youtubeId: "vthMCtgVtFw", searchQuery: "Flat Barbell Bench Press tutorial" }
 *
 * You can curate IDs per exercise without touching any other code.
 */

import type { WorkoutMode } from "@/lib/types";

export interface Exercise {
  name: string;
  sets: string;
  note?: string;
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
      { name: "Seated Shoulder Press", sets: "10, 8, 8, 6", youtubeId: "fHsKn4iUOhU", searchQuery: sq("Seated Dumbbell Shoulder Press") },
      { name: "DB Lateral Raise", sets: "15, 12, 12, 10", youtubeId: "3VcKaXpzqRo", searchQuery: sq("Dumbbell Lateral Raise") },
      { name: "Reverse Pec Deck", sets: "15, 12, 12, 10", searchQuery: sq("Reverse Pec Deck rear delt fly") },
      { name: "Upright Row", sets: "10, 10, 8", searchQuery: sq("Barbell Upright Row") },
      { name: "Hanging Leg Raise", sets: "15, 15, 12", searchQuery: sq("Hanging Leg Raise") },
      { name: "Cable Crunch", sets: "20, 15, 15", searchQuery: sq("Cable Crunch abs") },
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
      { name: "Pull-Ups / Lat Pulldown", sets: "12, 10, 10, 8", youtubeId: "O94yEoGXtBY", searchQuery: sq("Lat Pulldown") },
      { name: "Barbell Row", sets: "10, 8, 8, 6", youtubeId: "vT2GjY_Umpw", searchQuery: sq("Barbell Bent Over Row") },
      { name: "Seated Cable Row", sets: "12, 10, 8, 8", searchQuery: sq("Seated Cable Row") },
      { name: "Dumbbell Pullover", sets: "12, 10, 8", searchQuery: sq("Dumbbell Pullover lat") },
      { name: "Barbell Curl", sets: "10, 8, 8, 6", searchQuery: sq("Barbell Bicep Curl") },
      { name: "Incline Dumbbell Curl", sets: "12, 10, 8", searchQuery: sq("Incline Dumbbell Curl") },
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
      { name: "Flat Bench Press", sets: "8, 10, 8, 6", youtubeId: "vthMCtgVtFw", searchQuery: sq("Flat Barbell Bench Press") },
      { name: "Incline Dumbbell Press", sets: "10, 10, 8, 8", youtubeId: "8iPEnn-ltC8", searchQuery: sq("Incline Dumbbell Press") },
      { name: "Cable Fly / Pec Deck", sets: "15, 12, 12, 10", searchQuery: sq("Cable Chest Fly") },
      { name: "Tricep Pushdown", sets: "12, 10, 10, 8", searchQuery: sq("Tricep Pushdown") },
      { name: "Overhead DB Extension", sets: "12, 10, 8", searchQuery: sq("Overhead Dumbbell Tricep Extension") },
      { name: "Dips", sets: "3 sets to failure", searchQuery: sq("Tricep Dips bodyweight") },
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
      { name: "Close-Grip Bench Press", sets: "10, 8, 8, 6", searchQuery: sq("Close Grip Bench Press triceps") },
      { name: "Tricep Pushdown", sets: "12, 10, 10, 8", searchQuery: sq("Tricep Pushdown") },
      { name: "Skull Crushers", sets: "10, 8, 8", searchQuery: sq("Skull Crushers EZ bar") },
      { name: "Barbell Curl", sets: "10, 8, 8, 6", searchQuery: sq("Barbell Bicep Curl") },
      { name: "Hammer Curl", sets: "12, 10, 10", searchQuery: sq("Dumbbell Hammer Curl") },
      { name: "Preacher Curl", sets: "12, 10, 8", searchQuery: sq("Preacher Curl bicep") },
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
      { name: "Barbell Squat / Leg Press", sets: "10, 8, 8, 6", youtubeId: "bEv6CCg2BC8", searchQuery: sq("Barbell Back Squat") },
      { name: "Walking Lunges", sets: "12 each leg x 3", searchQuery: sq("Walking Dumbbell Lunges") },
      { name: "Leg Extension", sets: "15, 12, 10, 10", searchQuery: sq("Leg Extension machine") },
      { name: "Lying Leg Curl", sets: "12, 10, 10, 8", searchQuery: sq("Lying Leg Curl hamstring") },
      { name: "Romanian Deadlift", sets: "10, 8, 8", youtubeId: "5zmlnbWb-g4", searchQuery: sq("Romanian Deadlift RDL barbell") },
      { name: "Standing Calf Raise", sets: "20, 15, 15", searchQuery: sq("Standing Calf Raise") },
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
      { name: "DB Seated Shoulder Press", sets: "10, 8, 8, 6", note: "Bench upright", searchQuery: sq("Dumbbell Seated Shoulder Press") },
      { name: "DB Lateral Raise", sets: "15, 12, 12, 10", note: "Slow & controlled", youtubeId: "3VcKaXpzqRo", searchQuery: sq("Dumbbell Lateral Raise") },
      { name: "DB Front Raise", sets: "15, 12, 12, 10", note: "Replaces Pec Deck", searchQuery: sq("Dumbbell Front Raise shoulder") },
      { name: "DB Upright Row", sets: "10, 10, 8", note: "Wide grip", searchQuery: sq("Dumbbell Upright Row") },
      { name: "Lying Leg Raise", sets: "15, 15, 12", note: "Bench or floor", searchQuery: sq("Lying Leg Raise abs") },
      { name: "DB Weighted Crunch", sets: "20, 15, 15", note: "DB on chest", searchQuery: sq("Weighted Crunch dumbbell") },
    ],
  },
  {
    day: "Day 2", weekday: "Thu", focus: "Back + Biceps", icon: "💪", color: "#a78bfa",
    duration: "~60 min", epoc: true,
    cardio: "10–15 min bike · +80–110 cal",
    calNote: "Large back muscles = high burn. EPOC adds 10–15% after.",
    exercises: [
      { name: "DB Bent-Over Row", sets: "12, 10, 10, 8", note: "Replaces Lat Pulldown", searchQuery: sq("Dumbbell Bent Over Row") },
      { name: "Single-Arm DB Row", sets: "10, 8, 8, 6", note: "Brace on bench", searchQuery: sq("Single Arm Dumbbell Row") },
      { name: "DB Seal Row", sets: "12, 10, 8, 8", note: "Face down on bench", searchQuery: sq("Dumbbell Seal Row chest supported") },
      { name: "DB Pullover", sets: "12, 10, 8", note: "Full stretch", searchQuery: sq("Dumbbell Pullover") },
      { name: "DB Bicep Curl", sets: "10, 8, 8, 6", note: "Slow eccentric", searchQuery: sq("Dumbbell Bicep Curl") },
      { name: "Incline DB Curl", sets: "12, 10, 8", note: "Bench at 45°", searchQuery: sq("Incline Dumbbell Curl") },
    ],
  },
  {
    day: "Day 3", weekday: "Fri", focus: "Chest + Triceps", icon: "🫁", color: "#f87171",
    duration: "~60 min", epoc: true,
    cardio: "10–15 min bike · +80–110 cal",
    calNote: "DB pressing and compound movements are energy-demanding.",
    exercises: [
      { name: "DB Flat Bench Press", sets: "8, 10, 8, 6", note: "Full ROM", youtubeId: "SHsUIZiNdeY", searchQuery: sq("Dumbbell Flat Bench Press") },
      { name: "DB Incline Bench Press", sets: "10, 10, 8, 8", note: "30–45° angle", youtubeId: "8iPEnn-ltC8", searchQuery: sq("Incline Dumbbell Bench Press") },
      { name: "DB Chest Fly", sets: "15, 12, 12, 10", note: "Replaces Cable Fly", searchQuery: sq("Dumbbell Chest Fly") },
      { name: "DB Tricep Kickback", sets: "12, 10, 10, 8", note: "Replaces Pushdown", searchQuery: sq("Dumbbell Tricep Kickback") },
      { name: "DB Overhead Tricep Extension", sets: "12, 10, 8", note: "Both hands on DB", searchQuery: sq("Overhead Dumbbell Tricep Extension") },
      { name: "Diamond Push-Ups", sets: "3 sets to failure", note: "Replaces Dips", searchQuery: sq("Diamond Push Ups triceps") },
    ],
  },
  {
    day: "Day 4", weekday: "Sat", focus: "Arms", icon: "💥", color: "#fb923c",
    duration: "~50 min", epoc: false,
    cardio: "10–15 min bike · +80–110 cal",
    calNote: "Isolation exercises — lowest burn day.",
    exercises: [
      { name: "Close-Grip DB Press", sets: "10, 8, 8, 6", note: "Elbows tucked", searchQuery: sq("Close Grip Dumbbell Press triceps") },
      { name: "DB Tricep Kickback", sets: "12, 10, 10, 8", note: "Hinge at hips", searchQuery: sq("Dumbbell Tricep Kickback") },
      { name: "DB Skull Crushers", sets: "10, 8, 8", note: "Lower to forehead", searchQuery: sq("Dumbbell Skull Crushers") },
      { name: "DB Bicep Curl", sets: "10, 8, 8, 6", note: "Supinate at top", searchQuery: sq("Dumbbell Bicep Curl") },
      { name: "DB Hammer Curl", sets: "12, 10, 10", note: "Neutral grip", searchQuery: sq("Dumbbell Hammer Curl") },
      { name: "DB Concentration Curl", sets: "12, 10, 8", note: "Elbow on knee", searchQuery: sq("Dumbbell Concentration Curl") },
    ],
  },
  {
    day: "Day 5", weekday: "Sun", focus: "Legs", icon: "🦵", color: "#4ade80",
    duration: "~65 min", epoc: true,
    cardio: "15–20 min bike · +100–140 cal",
    calNote: "Highest burn — goblet squats, lunges & RDLs. EPOC adds 10–15% after.",
    exercises: [
      { name: "DB Goblet Squat", sets: "10, 8, 8, 6", note: "Replaces Barbell Squat", youtubeId: "MeIiIdhvXT4", searchQuery: sq("Goblet Squat dumbbell") },
      { name: "DB Walking Lunges", sets: "12 each leg x 3", note: "DBs at sides", searchQuery: sq("Dumbbell Walking Lunges") },
      { name: "DB Bulgarian Split Squat", sets: "15, 12, 10, 10", note: "Rear foot on bench", searchQuery: sq("Bulgarian Split Squat dumbbell") },
      { name: "DB Romanian Deadlift", sets: "12, 10, 10, 8", note: "Feel hamstring stretch", searchQuery: sq("Dumbbell Romanian Deadlift") },
      { name: "DB Stiff-Leg Deadlift", sets: "10, 8, 8", note: "Replaces Leg Curl", searchQuery: sq("Dumbbell Stiff Leg Deadlift hamstring") },
      { name: "Single-Leg Calf Raise", sets: "20, 15, 15", note: "Slow & full range", searchQuery: sq("Single Leg Calf Raise") },
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
