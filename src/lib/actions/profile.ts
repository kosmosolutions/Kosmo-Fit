"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type ProfileInput = Omit<
  Profile,
  | "user_id"
  | "created_at"
  | "updated_at"
  | "onboarded_at"
  | "active_template_id"
  | "active_plan_id"
  | "macro_protein_pct"
  | "macro_carb_pct"
  | "macro_fat_pct"
>;

export interface MacroOverrideInput {
  macro_protein_pct: number | null;
  macro_carb_pct: number | null;
  macro_fat_pct: number | null;
}

export async function updateMacroOverride(input: MacroOverrideInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const allNull =
    input.macro_protein_pct === null &&
    input.macro_carb_pct === null &&
    input.macro_fat_pct === null;
  if (!allNull) {
    const { macro_protein_pct: p, macro_carb_pct: c, macro_fat_pct: f } = input;
    if (p === null || c === null || f === null) {
      throw new Error("All three macro percentages must be set together.");
    }
    if (p + c + f !== 100) {
      throw new Error(
        `Macros must sum to 100 (got ${p + c + f}: ${p}P / ${c}C / ${f}F).`,
      );
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update(input)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}

export async function saveProfile(input: ProfileInput, finishOnboarding = false) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const row = {
    user_id: user.id,
    ...input,
    onboarded_at: finishOnboarding ? new Date().toISOString() : undefined,
  };

  const { error } = await supabase.from("profiles").upsert(row);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");

  if (finishOnboarding) redirect("/overview");
}
