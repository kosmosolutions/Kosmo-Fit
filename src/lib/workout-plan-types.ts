// Shared types for the workout-plan server actions. Kept out of the
// "use server" module because SWC only permits async-function exports there.

// A built plan's day layout: an ordered array, one entry per training day.
// day_index into user_workout_exercises maps to a position in this array.
export type BuiltDay = {
  weekday: number; // JS getDay(): 0=Sun … 6=Sat
  focus: string;
  icon: string;
  color: string;
  duration: string;
};

export interface BuiltExercisePayload {
  catalog_id: string | null;
  name: string;
  sets: string;
  search_query: string;
  images: string[] | null;
}

export interface CreateBuiltPlanInput {
  name: string;
  // One entry per training day, in display order. Day layout metadata
  // (icon/color/duration) is derived server-side from the focus.
  days: { weekday: number; focus: string }[];
  // Auto-filled exercises per mode, indexed by day (home[dayIndex] = rows).
  home: BuiltExercisePayload[][];
  gym: BuiltExercisePayload[][];
}
