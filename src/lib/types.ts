export type Lifestyle = "desk" | "light" | "active";
export type WorkoutMode = "home" | "gym";
export type MealType = "breakfast" | "snack" | "lunch" | "dinner";
export type Sex = "male" | "female" | "other";
export type Mood = "great" | "good" | "meh" | "bad";
export type FitnessExperience = "beginner" | "intermediate" | "advanced";
export type PrimaryGoal = "lose_fat" | "build_muscle" | "maintain" | "recomp";

export interface Profile {
  user_id: string;
  full_name: string | null;
  current_weight: number;
  goal_weight: number;
  height_ft: number;
  height_in: number;
  age: number;
  sex: Sex;
  lifestyle: Lifestyle;
  workout_mode: "home" | "gym" | "both";
  weeks_to_goal: number;
  daily_step_goal: number;
  fitness_experience: FitnessExperience | null;
  primary_goal: PrimaryGoal | null;
  active_template_id: string | null;
  macro_protein_pct: number | null;
  macro_carb_pct: number | null;
  macro_fat_pct: number | null;
  notes: string | null;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyEntry {
  id: string;
  user_id: string;
  entry_date: string;
  weight: number | null;
  steps: number;
  cardio_minutes: number;
  cardio_calories: number;
  workout_completed: boolean;
  workout_day_index: number | null;
  workout_mode: WorkoutMode | null;
  mood: Mood | null;
  water_oz: number;
  sleep_hours: number | null;
  notes: string | null;
}

export interface Recipe {
  id: string;
  user_id: string;
  name: string;
  meal_type: MealType | "any" | null;
  servings: number;
  calories_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  ingredients: Array<{ name: string; amount?: string }>;
  instructions: string | null;
  is_favorite: boolean;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  entry_date: string;
  meal_type: MealType;
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  recipe_id: string | null;
  created_at: string;
}
