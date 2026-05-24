"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface YearActivity {
  year: number;
  workoutDays: string[];
  dietDays: string[];
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
