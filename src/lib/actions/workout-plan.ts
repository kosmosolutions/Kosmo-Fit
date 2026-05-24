"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  GYM_DAYS,
  HOME_DAYS,
  type Exercise,
  type WorkoutDay,
} from "@/data/workouts";
import { getTemplate, WORKOUT_TEMPLATES } from "@/data/workout-templates";
import type { WorkoutMode } from "@/lib/types";

/**
 * Per-user customization model:
 *
 *  - If a user has ZERO rows for (mode, day_index), that day renders the
 *    default exercises from GYM_DAYS / HOME_DAYS.
 *  - The first edit to a day forks the defaults: every default exercise is
 *    copied into user_workout_exercises, then the edit is applied. After
 *    that, the day is "customized" — only user rows render for it.
 *  - Resetting a day deletes all user rows for that (mode, day_index),
 *    which makes the day fall back to defaults again.
 */

function defaultsFor(
  mode: WorkoutMode,
  templateId: string | null,
): WorkoutDay[] {
  if (!templateId || templateId === "custom-6day") {
    return mode === "gym" ? GYM_DAYS : HOME_DAYS;
  }
  const t = getTemplate(templateId);
  return t ? t.days[mode] : mode === "gym" ? GYM_DAYS : HOME_DAYS;
}

async function getActiveTemplateId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("active_template_id")
    .eq("user_id", userId)
    .single();
  if (error) return null;
  return (data?.active_template_id as string | null) ?? null;
}

export type UserExerciseRow = {
  id: number;
  user_id: string;
  mode: "home" | "gym";
  day_index: number;
  position: number;
  catalog_id: string | null;
  name: string;
  sets: string;
  note: string | null;
  images: string[] | null;
  search_query: string | null;
};

export async function getUserPlanRows(mode: WorkoutMode): Promise<UserExerciseRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("user_workout_exercises")
    .select("*")
    .eq("user_id", user.id)
    .eq("mode", mode)
    .order("day_index", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as UserExerciseRow[];
}

function exerciseToInsertRow(
  userId: string,
  mode: WorkoutMode,
  dayIndex: number,
  position: number,
  ex: Exercise & { catalog_id?: string | null },
) {
  return {
    user_id: userId,
    mode,
    day_index: dayIndex,
    position,
    catalog_id: ex.catalog_id ?? null,
    name: ex.name,
    sets: ex.sets,
    note: ex.note ?? null,
    images: ex.images ?? null,
    search_query: ex.searchQuery,
  };
}

async function forkDayIfPristine(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  mode: WorkoutMode,
  dayIndex: number,
): Promise<void> {
  const { count, error } = await supabase
    .from("user_workout_exercises")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mode", mode)
    .eq("day_index", dayIndex);
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;
  const activeTemplateId = await getActiveTemplateId(supabase, userId);
  const defaults = defaultsFor(mode, activeTemplateId)[dayIndex]?.exercises ?? [];
  if (defaults.length === 0) return;
  const rows = defaults.map((ex, i) =>
    exerciseToInsertRow(userId, mode, dayIndex, i, ex),
  );
  const { error: insErr } = await supabase
    .from("user_workout_exercises")
    .insert(rows);
  if (insErr) throw new Error(insErr.message);
}

async function nextPosition(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  mode: WorkoutMode,
  dayIndex: number,
): Promise<number> {
  const { data, error } = await supabase
    .from("user_workout_exercises")
    .select("position")
    .eq("user_id", userId)
    .eq("mode", mode)
    .eq("day_index", dayIndex)
    .order("position", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  const last = data?.[0]?.position ?? -1;
  return last + 1;
}

export interface AddExerciseInput {
  mode: WorkoutMode;
  day_index: number;
  catalog_id: string | null;
  name: string;
  sets?: string;
  note?: string | null;
  images?: string[] | null;
  search_query: string;
}

export async function addExerciseToDay(input: AddExerciseInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await forkDayIfPristine(supabase, user.id, input.mode, input.day_index);
  const position = await nextPosition(
    supabase,
    user.id,
    input.mode,
    input.day_index,
  );

  const { error } = await supabase.from("user_workout_exercises").insert({
    user_id: user.id,
    mode: input.mode,
    day_index: input.day_index,
    position,
    catalog_id: input.catalog_id,
    name: input.name,
    sets: input.sets ?? "3 x 10",
    note: input.note ?? null,
    images: input.images ?? null,
    search_query: input.search_query,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/workout");
}

export async function removeExerciseFromDay(
  mode: WorkoutMode,
  dayIndex: number,
  position: number,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await forkDayIfPristine(supabase, user.id, mode, dayIndex);

  const { error } = await supabase
    .from("user_workout_exercises")
    .delete()
    .eq("user_id", user.id)
    .eq("mode", mode)
    .eq("day_index", dayIndex)
    .eq("position", position);
  if (error) throw new Error(error.message);

  revalidatePath("/workout");
}

export interface ReplaceExerciseInput {
  mode: WorkoutMode;
  day_index: number;
  position: number;
  catalog_id: string | null;
  name: string;
  sets?: string;
  note?: string | null;
  images?: string[] | null;
  search_query: string;
}

export async function replaceExerciseInDay(
  input: ReplaceExerciseInput,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await forkDayIfPristine(supabase, user.id, input.mode, input.day_index);

  const { error } = await supabase
    .from("user_workout_exercises")
    .update({
      catalog_id: input.catalog_id,
      name: input.name,
      sets: input.sets ?? "3 x 10",
      note: input.note ?? null,
      images: input.images ?? null,
      search_query: input.search_query,
    })
    .eq("user_id", user.id)
    .eq("mode", input.mode)
    .eq("day_index", input.day_index)
    .eq("position", input.position);
  if (error) throw new Error(error.message);

  revalidatePath("/workout");
}

export async function resetDayToDefaults(
  mode: WorkoutMode,
  dayIndex: number,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("user_workout_exercises")
    .delete()
    .eq("user_id", user.id)
    .eq("mode", mode)
    .eq("day_index", dayIndex);
  if (error) throw new Error(error.message);

  revalidatePath("/workout");
}

/**
 * Switch the user's active workout template.
 *
 * Clears every customized exercise row for the user so the new template's
 * day-by-day defaults render immediately. Customizations from the previous
 * template are discarded — by design, applying a template is a deliberate
 * "start fresh" action.
 *
 * The "custom-6day" id is accepted as a no-customizations-clear toggle so
 * users can flip back to the original split without nuking their data.
 */
export async function applyTemplate(templateId: string): Promise<void> {
  const known = WORKOUT_TEMPLATES.some((t) => t.id === templateId);
  if (!known) throw new Error(`Unknown template: ${templateId}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Pull current active template so we can decide whether to wipe.
  const currentTemplateId = await getActiveTemplateId(supabase, user.id);

  if (currentTemplateId !== templateId) {
    const { error: delErr } = await supabase
      .from("user_workout_exercises")
      .delete()
      .eq("user_id", user.id);
    if (delErr) throw new Error(delErr.message);
  }

  const { error: upErr } = await supabase
    .from("profiles")
    .update({ active_template_id: templateId })
    .eq("user_id", user.id);
  if (upErr) throw new Error(upErr.message);

  revalidatePath("/workout");
}
