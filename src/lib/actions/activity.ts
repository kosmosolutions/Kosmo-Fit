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

  const [workoutRes, dietRes] = await Promise.all([
    supabase
      .from("daily_entries")
      .select("entry_date")
      .eq("user_id", user.id)
      .eq("workout_completed", true)
      .gte("entry_date", start)
      .lte("entry_date", end),
    supabase
      .from("food_entries")
      .select("entry_date")
      .eq("user_id", user.id)
      .gte("entry_date", start)
      .lte("entry_date", end),
  ]);

  return {
    year,
    workoutDays: (workoutRes.data ?? []).map((r) => r.entry_date),
    // food_entries has one row per meal, so de-dupe to one entry per day.
    dietDays: Array.from(
      new Set((dietRes.data ?? []).map((r) => r.entry_date)),
    ),
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

  const [dailyRes, dietRes] = await Promise.all([
    supabase
      .from("daily_entries")
      .select("entry_date, steps, workout_completed")
      .eq("user_id", user.id)
      .gte("entry_date", startISO)
      .lte("entry_date", endISO),
    supabase
      .from("food_entries")
      .select("entry_date")
      .eq("user_id", user.id)
      .gte("entry_date", startISO)
      .lte("entry_date", endISO),
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
    dietDays: new Set((dietRes.data ?? []).map((r) => r.entry_date)).size,
    totalSteps: stepRows.reduce((s, r) => s + (r.steps ?? 0), 0),
  };
}
