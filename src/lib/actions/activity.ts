"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fromISODate } from "@/lib/dates";

export interface YearActivity {
  year: number;
  workoutDays: string[];
  dietDays: string[];
}

export interface ActivityStats {
  startDate: string;
  endDate: string;
  totalDays: number;
  workoutDays: number;
  stepDays: number;
  dietDays: number;
  totalSteps: number;
}

// food_entries has one row per LOGGED FOOD, so a year can exceed PostgREST's
// 1000-row response cap (~3 items/day does it). Page through the window and
// collapse to distinct days; without this the calendar's diet dots silently
// drop an arbitrary subset of days.
async function fetchDietDays(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  start: string,
  end: string,
): Promise<Set<string>> {
  const PAGE = 1000;
  const days = new Set<string>();
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase
      .from("food_entries")
      .select("entry_date")
      .eq("user_id", userId)
      .gte("entry_date", start)
      .lte("entry_date", end)
      .order("entry_date", { ascending: true })
      .range(from, from + PAGE - 1);
    const rows = data ?? [];
    for (const r of rows) days.add(r.entry_date);
    if (rows.length < PAGE) break;
  }
  return days;
}

// Fetches one year of activity for the current user. Returns ISO date strings
// for days that have a completed workout or any food entry logged.
//
// Lazy-loaded per year by the heatmap so we only pull what the user is
// currently looking at — never the entire history at once.
export async function getActivityYear(year: number): Promise<YearActivity> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [workoutRes, dietDays] = await Promise.all([
    supabase
      .from("daily_entries")
      .select("entry_date")
      .eq("user_id", user.id)
      .eq("workout_completed", true)
      .gte("entry_date", start)
      .lte("entry_date", end),
    fetchDietDays(supabase, user.id, start, end),
  ]);

  return {
    year,
    workoutDays: (workoutRes.data ?? []).map((r) => r.entry_date),
    dietDays: Array.from(dietDays),
  };
}

// Aggregates adherence over an arbitrary [start, end] window for the consistency
// stats panel: how many distinct days had a workout, steps, or any food logged,
// against the number of calendar days in the window.
export async function getActivityStats(
  startISO: string,
  endISO: string,
): Promise<ActivityStats> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [dailyRes, dietDays] = await Promise.all([
    supabase
      .from("daily_entries")
      .select("entry_date, steps, workout_completed")
      .eq("user_id", user.id)
      .gte("entry_date", startISO)
      .lte("entry_date", endISO),
    fetchDietDays(supabase, user.id, startISO, endISO),
  ]);

  // daily_entries is unique per (user, date), so each row is already a distinct day.
  const daily = dailyRes.data ?? [];
  const stepRows = daily.filter((r) => (r.steps ?? 0) > 0);

  const ms = fromISODate(endISO).getTime() - fromISODate(startISO).getTime();
  const totalDays = ms >= 0 ? Math.round(ms / 86_400_000) + 1 : 0;

  return {
    startDate: startISO,
    endDate: endISO,
    totalDays,
    workoutDays: daily.filter((r) => r.workout_completed).length,
    stepDays: stepRows.length,
    dietDays: dietDays.size,
    totalSteps: stepRows.reduce((s, r) => s + (r.steps ?? 0), 0),
  };
}
