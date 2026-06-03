import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dailyCalorieTarget, dayIndexForDate } from "@/lib/calc";
import { WorkoutClient } from "@/components/WorkoutClient";
import { getUserPlanRows, getUserPlans } from "@/lib/actions/workout-plan";
import { fromISODate } from "@/lib/dates";
import { localTodayISO } from "@/lib/serverDate";
import type { WorkoutMode } from "@/lib/types";

export default async function WorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
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

  const { date: dateParam } = await searchParams;
  const localToday = await localTodayISO();
  const selectedDate = dateParam ?? localToday;
  const isToday = selectedDate === localToday;
  const today = fromISODate(selectedDate);
  const dayIdx = dayIndexForDate(today);
  const todayDate = selectedDate;

  // Fetch both modes up-front so the user can switch home<->gym without
  // a network round-trip. Both lists are typically <50 rows total.
  const [homePlan, gymPlan, plans, { data: daily }] = await Promise.all([
    getUserPlanRows("home"),
    getUserPlanRows("gym"),
    getUserPlans(),
    supabase
      .from("daily_entries")
      .select(
        "workout_completed, workout_day_index, cardio_minutes, cardio_calories, cardio_type",
      )
      .eq("user_id", user.id)
      .eq("entry_date", todayDate)
      .maybeSingle(),
  ]);

  const activePlanId: string | null = profile.active_plan_id ?? null;
  const activePlan = activePlanId
    ? (plans.find((p) => p.id === activePlanId) ?? null)
    : null;

  // A built plan carries its own day layout; otherwise the day layout +
  // calorie banner resolve from the effective template (a snapshot plan's
  // base template when on a plan, else the active template).
  const builtDays = activePlan?.is_built ? (activePlan.days ?? []) : null;
  const effectiveTemplateId = builtDays
    ? null
    : activePlan
      ? activePlan.base_template_id
      : (profile.active_template_id ?? null);

  // Default the day picker to today: for a built plan, the training day whose
  // weekday matches; for template/legacy layouts, the legacy weekday map.
  const initialDay = builtDays
    ? Math.max(
        0,
        builtDays.findIndex((bd) => bd.weekday === today.getDay()),
      )
    : dayIdx >= 0
      ? dayIdx
      : 0;

  return (
    <WorkoutClient
      initialMode={initialMode}
      initialDay={initialDay}
      todayTarget={dailyCalorieTarget(
        stats,
        dayIdx,
        daily?.workout_completed ?? false,
        daily?.cardio_calories ?? 0,
      )}
      todayBurn={dayIdx >= 0 ? stats.burns[dayIdx] : 0}
      dailyDeficit={stats.dailyDeficit}
      lifeTDEE={stats.lifeTDEE}
      weekTargets={stats.dayTargets}
      weekBurns={stats.burns}
      restTarget={stats.restTarget}
      homePlan={homePlan}
      gymPlan={gymPlan}
      activeTemplateId={effectiveTemplateId}
      builtDays={builtDays}
      plans={plans}
      activePlanId={activePlanId}
      activePlanName={activePlan?.name ?? null}
      todayDate={todayDate}
      isToday={isToday}
      todayCompleted={daily?.workout_completed ?? false}
      completedDayIndex={daily?.workout_day_index ?? null}
      todayCardioMinutes={daily?.cardio_minutes ?? 0}
      todayCardioCalories={daily?.cardio_calories ?? 0}
      todayCardioType={daily?.cardio_type ?? null}
      bodyWeightLbs={Number(profile.current_weight) || 0}
    />
  );
}

