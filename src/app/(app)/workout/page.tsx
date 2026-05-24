import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dayIndexForDate } from "@/lib/calc";
import { WorkoutClient } from "@/components/WorkoutClient";
import { getUserPlanRows } from "@/lib/actions/workout-plan";
import { todayISO } from "@/lib/dates";
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
  const todayDate = todayISO();

  // Fetch both modes up-front so the user can switch home<->gym without
  // a network round-trip. Both lists are typically <50 rows total.
  const [homePlan, gymPlan, { data: daily }] = await Promise.all([
    getUserPlanRows("home"),
    getUserPlanRows("gym"),
    supabase
      .from("daily_entries")
      .select("workout_completed, cardio_minutes, cardio_calories")
      .eq("user_id", user.id)
      .eq("entry_date", todayDate)
      .maybeSingle(),
  ]);

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
      homePlan={homePlan}
      gymPlan={gymPlan}
      activeTemplateId={profile.active_template_id ?? null}
      todayDate={todayDate}
      todayCompleted={daily?.workout_completed ?? false}
      todayCardioMinutes={daily?.cardio_minutes ?? 0}
      todayCardioCalories={daily?.cardio_calories ?? 0}
      bodyWeightLbs={Number(profile.current_weight) || 0}
    />
  );
}

