"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface WeightPoint {
  date: string;
  weight: number;
}

/**
 * Return all logged weights for the current user, oldest → newest.
 * Filters out daily_entries rows where weight is null. The cap is
 * intentionally high — the chart subsamples client-side if needed.
 */
export async function getWeightHistory(
  days = 180,
): Promise<WeightPoint[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_entries")
    .select("entry_date, weight")
    .eq("user_id", user.id)
    .gte("entry_date", sinceISO)
    .not("weight", "is", null)
    .order("entry_date", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    date: r.entry_date as string,
    weight: Number(r.weight),
  }));
}
