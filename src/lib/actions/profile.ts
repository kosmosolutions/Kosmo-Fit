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
>;

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
