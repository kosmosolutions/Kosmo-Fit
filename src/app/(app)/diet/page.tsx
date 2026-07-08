import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dailyCalorieTarget } from "@/lib/calc";
import { resolvePlanDay } from "@/lib/planDay";
import { fromISODate } from "@/lib/dates";
import { localTodayISO } from "@/lib/serverDate";
import { AddMealDialog } from "@/components/AddMealDialog";
import { FoodEntryRow } from "@/components/FoodEntryRow";
import { MacroBreakdown } from "@/components/MacroBreakdown";
import { getRecentFoods } from "@/lib/actions/entries";
import type { FoodEntry, MealType, Recipe } from "@/lib/types";
import { BookOpen, Sunrise, Coffee, Soup, Moon } from "lucide-react";

const MEAL_ICONS: Record<
  MealType,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  breakfast: Sunrise,
  snack: Coffee,
  lunch: Soup,
  dinner: Moon,
};

const MEAL_COLORS: Record<MealType, string> = {
  breakfast: "#D9A441", // amber sunrise
  snack: "#0A84FF", // blue
  lunch: "#30D158", // green
  dinner: "#BF5AF2", // violet dusk
};

const MEAL_ORDER: MealType[] = ["breakfast", "snack", "lunch", "dinner"];

export default async function DietPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const localToday = await localTodayISO();
  const today = dateParam ?? localToday;

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

  const [{ data: food }, { data: recipes }, { data: daily }, recentFoods, { data: activePlan }] =
    await Promise.all([
      supabase
        .from("food_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .order("created_at"),
      supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("is_favorite", { ascending: false })
        .order("name"),
      supabase
        .from("daily_entries")
        .select("workout_completed, cardio_calories")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .maybeSingle(),
      getRecentFoods(8),
      profile.active_plan_id
        ? supabase
            .from("workout_plans")
            .select("id, base_template_id, is_built, days")
            .eq("user_id", user.id)
            .eq("id", profile.active_plan_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const entries = (food ?? []) as FoodEntry[];
  const rcps = (recipes ?? []) as Recipe[];

  const grouped = MEAL_ORDER.map((meal) => ({
    meal,
    entries: entries.filter((e) => e.meal_type === meal),
  }));

  const mode = profile.workout_mode === "gym" ? ("gym" as const) : ("home" as const);
  const stats = calcStats(profile, mode);
  const { burn } = resolvePlanDay({
    date: fromISODate(today),
    mode,
    activeTemplateId: activePlan
      ? activePlan.base_template_id
      : (profile.active_template_id ?? null),
    builtDays: activePlan?.is_built ? (activePlan.days ?? null) : null,
  });
  const target = dailyCalorieTarget(
    stats,
    burn,
    !!daily?.workout_completed,
    daily?.cardio_calories ?? 0,
  );

  const nextMeal = grouped.find((g) => g.entries.length === 0)?.meal ?? "breakfast";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="metric-label">Nutrition</div>
          <h1 className="display text-[28px] leading-tight text-white">
            {today === localToday ? "Today's meals" : "Logged meals"}
          </h1>
        </div>
        <Link
          href="/diet/recipes"
          className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full bg-accent-orange/15 px-3.5 text-[13px] font-semibold text-accent-orange transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-accent-orange/25"
        >
          <BookOpen className="h-4 w-4" />
          Recipes
          <span className="rounded-full bg-accent-orange/25 px-1.5 py-0.5 text-[10px] font-semibold text-accent-orange">
            {rcps.length}
          </span>
        </Link>
      </div>

      <MacroBreakdown
        entries={entries}
        target={target}
        proteinGoal={stats.proteinG}
        carbGoal={stats.workoutMacros.carbG}
        fatGoal={stats.workoutMacros.fatG}
      />

      <AddMealDialog
        entryDate={today}
        recipes={rcps}
        recentFoods={recentFoods}
        defaultMeal={nextMeal}
        triggerVariant="primary"
        triggerLabel="Log food"
      />

      <div className="space-y-3">
        {grouped.map(({ meal, entries }) => {
          const Icon = MEAL_ICONS[meal];
          const mealColor = MEAL_COLORS[meal];
          const mealCal = entries.reduce((s, e) => s + e.calories, 0);
          return (
            <section key={meal} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                    style={{ background: `${mealColor}1f` }}
                  >
                    <Icon
                      className="h-[18px] w-[18px]"
                      style={{ color: mealColor }}
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-bold capitalize leading-tight text-white">
                      {meal}
                    </div>
                    <div className="text-[11px] font-medium text-chalk-400">
                      {mealCal > 0
                        ? `${mealCal.toLocaleString()} cal · ${entries.length} item${entries.length > 1 ? "s" : ""}`
                        : "Not logged"}
                    </div>
                  </div>
                </div>
                <AddMealDialog
                  entryDate={today}
                  recipes={rcps}
                  recentFoods={recentFoods}
                  defaultMeal={meal}
                />
              </div>
              {entries.length > 0 && (
                <div className="mt-3 border-t border-white/[0.06] pt-1">
                  {entries.map((e) => (
                    <FoodEntryRow key={e.id} entry={e} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
