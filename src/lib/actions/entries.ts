"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MealType, Mood, WorkoutMode } from "@/lib/types";

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export interface DailyPatch {
  entry_date: string;
  weight?: number | null;
  steps?: number;
  cardio_minutes?: number;
  cardio_calories?: number;
  cardio_type?: string | null;
  workout_completed?: boolean;
  workout_day_index?: number | null;
  workout_mode?: WorkoutMode | null;
  mood?: Mood | null;
  water_oz?: number;
  sleep_hours?: number | null;
  notes?: string | null;
}

export async function upsertDailyEntry(patch: DailyPatch) {
  const { supabase, userId } = await authed();
  const { error } = await supabase
    .from("daily_entries")
    .upsert(
      { user_id: userId, ...patch },
      { onConflict: "user_id,entry_date" },
    );
  if (error) throw new Error(error.message);
  revalidatePath("/overview");
  revalidatePath("/workout");
  revalidatePath("/profile");
}

export async function addFoodEntry(input: {
  entry_date: string;
  meal_type: MealType;
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  recipe_id?: string | null;
}) {
  const { supabase, userId } = await authed();
  const { error } = await supabase.from("food_entries").insert({
    user_id: userId,
    ...input,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/diet");
  revalidatePath("/overview");
}

export async function updateFoodEntry(
  id: string,
  patch: {
    meal_type?: MealType;
    name?: string;
    servings?: number;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  },
) {
  const { supabase, userId } = await authed();
  const { error } = await supabase
    .from("food_entries")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/diet");
  revalidatePath("/overview");
}

export interface RecentFood {
  name: string;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// Most-recent distinct foods the user has logged, newest first. Powers the
// quick-add list under the Foods search so re-logging a staple is one tap.
export async function getRecentFoods(limit = 8): Promise<RecentFood[]> {
  const { supabase, userId } = await authed();
  const { data } = await supabase
    .from("food_entries")
    .select("name, servings, calories, protein_g, carbs_g, fat_g, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  const seen = new Set<string>();
  const out: RecentFood[] = [];
  for (const r of data ?? []) {
    const key = r.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      name: r.name,
      servings: Number(r.servings) || 1,
      calories: r.calories,
      protein_g: r.protein_g,
      carbs_g: r.carbs_g,
      fat_g: r.fat_g,
    });
    if (out.length >= limit) break;
  }
  return out;
}

export async function deleteFoodEntry(id: string) {
  const { supabase } = await authed();
  const { error } = await supabase.from("food_entries").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/diet");
  revalidatePath("/overview");
}
