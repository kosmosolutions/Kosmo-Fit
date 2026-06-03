import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dailyCalorieTarget, dayIndexForDate } from "@/lib/calc";
import { fromISODate } from "@/lib/dates";
import { localTodayISO } from "@/lib/serverDate";
import { AddMealDialog } from "@/components/AddMealDialog";
import { FoodEntryRow } from "@/components/FoodEntryRow";
import { MacroBreakdown } from "@/components/MacroBreakdown";
import type { FoodEntry, MealType, Recipe } from "@/lib/types";
import { BookOpen, Sunrise, Coffee, Soup, Moon } from "lucide-react";

const MEAL_ICONS: Record<MealType, React.ComponentType<{ className?: string }>> = {
  breakfast: Sunrise,
  snack: Coffee,
  lunch: Soup,
  dinner: Moon,
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

  const [{ data: food }, { data: recipes }, { data: daily }] = await Promise.all([
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
  ]);

  const entries = (food ?? []) as FoodEntry[];
  const rcps = (recipes ?? []) as Recipe[];

  const grouped = MEAL_ORDER.map((meal) => ({
    meal,
    entries: entries.filter((e) => e.meal_type === meal),
  }));

  const dayIdx = dayIndexForDate(fromISODate(today));
  const mode = profile.workout_mode === "gym" ? ("gym" as const) : ("home" as const);
  const stats = calcStats(profile, mode);
  const target = dailyCalorieTarget(
    stats,
    dayIdx,
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
        defaultMeal={nextMeal}
        triggerVariant="primary"
        triggerLabel="Log food"
      />

      <ol className="relative space-y-3">
        <span
          aria-hidden
          className="absolute bottom-6 left-[19px] top-6 w-px bg-white/[0.06]"
        />
        {grouped.map(({ meal, entries }) => {
          const Icon = MEAL_ICONS[meal];
          const mealCal = entries.reduce((s, e) => s + e.calories, 0);
          return (
            <li key={meal} className="relative flex gap-3">
              <div className="relative z-10 mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-850">
                <Icon className="h-4 w-4 text-chalk-300" />
              </div>
              <div className="card min-w-0 flex-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="text-[15px] font-bold capitalize text-white">
                      {meal}
                    </div>
                    {mealCal > 0 ? (
                      <div className="rounded-full bg-ink-800 px-2.5 py-0.5 text-[11px] font-semibold text-chalk-300">
                        {mealCal} cal
                      </div>
                    ) : null}
                  </div>
                  <AddMealDialog
                    entryDate={today}
                    recipes={rcps}
                    defaultMeal={meal}
                  />
                </div>
                {entries.length === 0 ? (
                  <div className="mt-3 text-[12px] font-medium text-chalk-400">
                    Nothing logged yet.
                  </div>
                ) : (
                  <div className="mt-2">
                    {entries.map((e) => (
                      <FoodEntryRow key={e.id} entry={e} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
