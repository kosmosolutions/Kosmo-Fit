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
 *  - "Active context" = the active plan_id. NULL means the user is on a
 *    stock template and edits land in the scratch working copy (rows with
 *    plan_id IS NULL). A uuid means the user is on that saved plan and
 *    edits land in rows with plan_id = that uuid. Every read/write of
 *    user_workout_exercises is scoped by this.
 *  - Within a context, a (mode, day_index) with ZERO rows renders the
 *    effective template's defaults. The first edit forks the defaults:
 *    they're copied into rows (with the active plan_id), then mutated.
 *  - Resetting a day deletes that context's rows for the day → defaults.
 */

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface ActiveContext {
  activeTemplateId: string | null;
  activePlanId: string | null;
  // The template whose day layout + defaults apply right now: a saved
  // plan's base template when on a plan, else the active template.
  effectiveTemplateId: string | null;
}

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

async function resolveContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActiveContext> {
  const { data } = await supabase
    .from("profiles")
    .select("active_template_id, active_plan_id")
    .eq("user_id", userId)
    .single();
  const activeTemplateId = (data?.active_template_id as string | null) ?? null;
  const activePlanId = (data?.active_plan_id as string | null) ?? null;

  let effectiveTemplateId = activeTemplateId;
  if (activePlanId) {
    const { data: plan } = await supabase
      .from("workout_plans")
      .select("base_template_id")
      .eq("id", activePlanId)
      .eq("user_id", userId)
      .single();
    effectiveTemplateId =
      (plan?.base_template_id as string | null) ?? activeTemplateId;
  }
  return { activeTemplateId, activePlanId, effectiveTemplateId };
}

export type UserExerciseRow = {
  id: number;
  user_id: string;
  plan_id: string | null;
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

export type WorkoutPlanRow = {
  id: string;
  name: string;
  base_template_id: string;
  created_at: string;
};

export async function getUserPlanRows(
  mode: WorkoutMode,
): Promise<UserExerciseRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { activePlanId } = await resolveContext(supabase, user.id);
  let query = supabase
    .from("user_workout_exercises")
    .select("*")
    .eq("user_id", user.id)
    .eq("mode", mode);
  query = activePlanId
    ? query.eq("plan_id", activePlanId)
    : query.is("plan_id", null);
  const { data, error } = await query
    .order("day_index", { ascending: true })
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as UserExerciseRow[];
}

function exerciseToInsertRow(
  userId: string,
  planId: string | null,
  mode: WorkoutMode,
  dayIndex: number,
  position: number,
  ex: Exercise & { catalog_id?: string | null },
) {
  return {
    user_id: userId,
    plan_id: planId,
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
  supabase: SupabaseClient,
  userId: string,
  ctx: ActiveContext,
  mode: WorkoutMode,
  dayIndex: number,
): Promise<void> {
  let countQuery = supabase
    .from("user_workout_exercises")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("mode", mode)
    .eq("day_index", dayIndex);
  countQuery = ctx.activePlanId
    ? countQuery.eq("plan_id", ctx.activePlanId)
    : countQuery.is("plan_id", null);
  const { count, error } = await countQuery;
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  const defaults =
    defaultsFor(mode, ctx.effectiveTemplateId)[dayIndex]?.exercises ?? [];
  if (defaults.length === 0) return;
  const rows = defaults.map((ex, i) =>
    exerciseToInsertRow(userId, ctx.activePlanId, mode, dayIndex, i, ex),
  );
  const { error: insErr } = await supabase
    .from("user_workout_exercises")
    .insert(rows);
  if (insErr) throw new Error(insErr.message);
}

async function nextPosition(
  supabase: SupabaseClient,
  userId: string,
  planId: string | null,
  mode: WorkoutMode,
  dayIndex: number,
): Promise<number> {
  let query = supabase
    .from("user_workout_exercises")
    .select("position")
    .eq("user_id", userId)
    .eq("mode", mode)
    .eq("day_index", dayIndex);
  query = planId ? query.eq("plan_id", planId) : query.is("plan_id", null);
  const { data, error } = await query
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

  const ctx = await resolveContext(supabase, user.id);
  await forkDayIfPristine(supabase, user.id, ctx, input.mode, input.day_index);
  const position = await nextPosition(
    supabase,
    user.id,
    ctx.activePlanId,
    input.mode,
    input.day_index,
  );

  const { error } = await supabase.from("user_workout_exercises").insert({
    user_id: user.id,
    plan_id: ctx.activePlanId,
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

  const ctx = await resolveContext(supabase, user.id);
  await forkDayIfPristine(supabase, user.id, ctx, mode, dayIndex);

  let del = supabase
    .from("user_workout_exercises")
    .delete()
    .eq("user_id", user.id)
    .eq("mode", mode)
    .eq("day_index", dayIndex)
    .eq("position", position);
  del = ctx.activePlanId
    ? del.eq("plan_id", ctx.activePlanId)
    : del.is("plan_id", null);
  const { error } = await del;
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

  const ctx = await resolveContext(supabase, user.id);
  await forkDayIfPristine(supabase, user.id, ctx, input.mode, input.day_index);

  let upd = supabase
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
  upd = ctx.activePlanId
    ? upd.eq("plan_id", ctx.activePlanId)
    : upd.is("plan_id", null);
  const { error } = await upd;
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

  const ctx = await resolveContext(supabase, user.id);
  let del = supabase
    .from("user_workout_exercises")
    .delete()
    .eq("user_id", user.id)
    .eq("mode", mode)
    .eq("day_index", dayIndex);
  del = ctx.activePlanId
    ? del.eq("plan_id", ctx.activePlanId)
    : del.is("plan_id", null);
  const { error } = await del;
  if (error) throw new Error(error.message);

  revalidatePath("/workout");
}

/**
 * Switch the user's active stock template. Clears only the SCRATCH working
 * copy (plan_id IS NULL) when the template actually changes — saved plans
 * are untouched. Also drops out of any active saved plan.
 */
export async function applyTemplate(templateId: string): Promise<void> {
  const known = WORKOUT_TEMPLATES.some((t) => t.id === templateId);
  if (!known) throw new Error(`Unknown template: ${templateId}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activeTemplateId, activePlanId } = await resolveContext(
    supabase,
    user.id,
  );

  // Wipe the scratch copy only when leaving the current template (or
  // stepping off a saved plan back onto the same template id).
  if (activeTemplateId !== templateId || activePlanId !== null) {
    const { error: delErr } = await supabase
      .from("user_workout_exercises")
      .delete()
      .eq("user_id", user.id)
      .is("plan_id", null);
    if (delErr) throw new Error(delErr.message);
  }

  const { error: upErr } = await supabase
    .from("profiles")
    .update({ active_template_id: templateId, active_plan_id: null })
    .eq("user_id", user.id);
  if (upErr) throw new Error(upErr.message);

  revalidatePath("/workout");
}

export async function getUserPlans(): Promise<WorkoutPlanRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("workout_plans")
    .select("id, name, base_template_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as WorkoutPlanRow[];
}

/**
 * Snapshot the current effective plan (scratch or active saved plan) into a
 * new named saved plan, then switch onto it. The source rows are COPIED, not
 * moved — so the scratch working copy survives for the underlying template.
 */
export async function createPlanFromCurrent(name: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Plan name can't be empty.");

  const ctx = await resolveContext(supabase, user.id);
  const baseTemplateId = ctx.effectiveTemplateId ?? "custom-6day";

  const { data: created, error: planErr } = await supabase
    .from("workout_plans")
    .insert({
      user_id: user.id,
      name: trimmed,
      base_template_id: baseTemplateId,
    })
    .select("id")
    .single();
  if (planErr) throw new Error(planErr.message);
  const newPlanId = created!.id as string;

  // Pull all current-context rows for both modes up front.
  let currentQuery = supabase
    .from("user_workout_exercises")
    .select("*")
    .eq("user_id", user.id);
  currentQuery = ctx.activePlanId
    ? currentQuery.eq("plan_id", ctx.activePlanId)
    : currentQuery.is("plan_id", null);
  const { data: currentRows, error: curErr } = await currentQuery;
  if (curErr) throw new Error(curErr.message);
  const rows = (currentRows ?? []) as UserExerciseRow[];

  const inserts: ReturnType<typeof exerciseToInsertRow>[] = [];
  for (const mode of ["home", "gym"] as const) {
    const days = defaultsFor(mode, baseTemplateId);
    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
      const customForDay = rows
        .filter((r) => r.mode === mode && r.day_index === dayIndex)
        .sort((a, b) => a.position - b.position);
      const source: Array<Exercise & { catalog_id?: string | null }> =
        customForDay.length > 0
          ? customForDay.map((r) => ({
              name: r.name,
              sets: r.sets,
              note: r.note ?? undefined,
              images: r.images ?? undefined,
              searchQuery: r.search_query ?? `${r.name} proper form tutorial`,
              catalog_id: r.catalog_id,
            }))
          : (days[dayIndex]?.exercises ?? []);
      source.forEach((ex, i) =>
        inserts.push(
          exerciseToInsertRow(user.id, newPlanId, mode, dayIndex, i, ex),
        ),
      );
    }
  }

  if (inserts.length > 0) {
    const { error: insErr } = await supabase
      .from("user_workout_exercises")
      .insert(inserts);
    if (insErr) throw new Error(insErr.message);
  }

  const { error: upErr } = await supabase
    .from("profiles")
    .update({ active_plan_id: newPlanId })
    .eq("user_id", user.id);
  if (upErr) throw new Error(upErr.message);

  revalidatePath("/workout");
}

export async function applyPlan(planId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: plan, error } = await supabase
    .from("workout_plans")
    .select("id")
    .eq("id", planId)
    .eq("user_id", user.id)
    .single();
  if (error || !plan) throw new Error("Plan not found.");

  const { error: upErr } = await supabase
    .from("profiles")
    .update({ active_plan_id: planId })
    .eq("user_id", user.id);
  if (upErr) throw new Error(upErr.message);

  revalidatePath("/workout");
}

export async function deletePlan(planId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { activePlanId } = await resolveContext(supabase, user.id);
  if (activePlanId === planId) {
    const { error: upErr } = await supabase
      .from("profiles")
      .update({ active_plan_id: null })
      .eq("user_id", user.id);
    if (upErr) throw new Error(upErr.message);
  }

  const { error } = await supabase
    .from("workout_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/workout");
}

export async function renamePlan(planId: string, name: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Plan name can't be empty.");

  const { error } = await supabase
    .from("workout_plans")
    .update({ name: trimmed })
    .eq("id", planId)
    .eq("user_id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/workout");
}
