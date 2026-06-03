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

export async function saveRecipe(
  input: RecipeInput,
  id?: string,
  opts?: { redirectAfter?: boolean },
) {
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
  // The standalone recipe form wants to navigate back to the library; the
  // in-dialog quick-add save passes redirectAfter:false to stay put.
  if (opts?.redirectAfter !== false) redirect("/diet/recipes");
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

// Input shape from the catalog browser. Macros here are TOTAL per recipe;
// we divide by `servings` to populate calories_per_serving / protein_g /
// carbs_g / fat_g on the user-owned row.
export interface CatalogRecipeInput {
  name: string;
  source: string | null;
  servings: number;
  calories_total: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  instructions: string | null;
  ingredients: Array<{ name: string; amount?: string }>;
  meal_type: MealType | "any" | null;
}

export async function saveCatalogRecipe(input: CatalogRecipeInput) {
  const { supabase, userId } = await authed();
  const s = Math.max(1, input.servings || 1);
  const { error } = await supabase.from("recipes").insert({
    user_id: userId,
    name: input.name,
    meal_type: input.meal_type,
    servings: s,
    calories_per_serving: Math.round(input.calories_total / s),
    protein_g: Math.round(input.protein_g / s),
    carbs_g: Math.round(input.carbs_g / s),
    fat_g: Math.round(input.fat_g / s),
    ingredients: input.ingredients,
    instructions: input.source
      ? `${input.instructions ?? ""}\n\nSource: ${input.source}`.trim()
      : input.instructions,
    is_favorite: false,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/diet");
  revalidatePath("/diet/recipes");
}
