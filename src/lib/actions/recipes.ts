"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MealType } from "@/lib/types";

async function authed() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export interface RecipeInput {
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

export async function saveRecipe(input: RecipeInput, id?: string) {
  const { supabase, userId } = await authed();
  if (id) {
    const { error } = await supabase
      .from("recipes")
      .update(input)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("recipes")
      .insert({ user_id: userId, ...input });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/diet");
  revalidatePath("/diet/recipes");
  redirect("/diet/recipes");
}

export async function deleteRecipe(id: string) {
  const { supabase, userId } = await authed();
  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidatePath("/diet/recipes");
}
