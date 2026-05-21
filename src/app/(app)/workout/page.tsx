import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dayIndexForDate } from "@/lib/calc";
import { WorkoutClient } from "@/components/WorkoutClient";
import type { WorkoutMode } from "@/lib/types";

export default async function WorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (!profile) redirect("/onboarding");

  const initialMode: WorkoutMode =
    profile.workout_mode === "gym" ? "gym" : "home";
  const stats = calcStats(profile, initialMode);

  const today = new Date();
  const dayIdx = dayIndexForDate(today);
  const initialDay = dayIdx >= 0 ? dayIdx : 0;

  return (
    <WorkoutClient
      initialMode={initialMode}
      initialDay={initialDay}
      todayTarget={
        dayIdx >= 0 ? stats.dayTargets[dayIdx] : stats.restTarget
      }
      todayBurn={dayIdx >= 0 ? stats.burns[dayIdx] : 0}
      dailyDeficit={stats.dailyDeficit}
      lifeTDEE={stats.lifeTDEE}
      weekTargets={stats.dayTargets}
    />
  );
}
