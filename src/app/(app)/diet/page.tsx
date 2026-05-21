import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dayIndexForDate } from "@/lib/calc";
import { fromISODate, todayISO } from "@/lib/dates";
import { Ring } from "@/components/Ring";
import { AddMealDialog } from "@/components/AddMealDialog";
import { FoodEntryRow } from "@/components/FoodEntryRow";
import type { FoodEntry, MealType, Recipe } from "@/lib/types";
import { BookOpen, ArrowRight, Sunrise, Coffee, Soup, Moon } from "lucide-react";

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
  const today = dateParam ?? todayISO();

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

  const [{ data: food }, { data: recipes }] = await Promise.all([
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
  ]);

  const entries = (food ?? []) as FoodEntry[];
  const rcps = (recipes ?? []) as Recipe[];

  const grouped = MEAL_ORDER.map((meal) => ({
    meal,
    entries: entries.filter((e) => e.meal_type === meal),
  }));

  const totals = entries.reduce(
    (acc, e) => {
      acc.cal += e.calories;
      acc.p += e.protein_g;
      acc.c += e.carbs_g;
      acc.f += e.fat_g;
      return acc;
    },
    { cal: 0, p: 0, c: 0, f: 0 },
  );

  const dayIdx = dayIndexForDate(fromISODate(today));
  const mode = profile.workout_mode === "gym" ? ("gym" as const) : ("home" as const);
  const stats = calcStats(profile, mode);
  const target = dayIdx >= 0 ? stats.dayTargets[dayIdx] : stats.restTarget;

  return (
    <div className="space-y-5">
      <div>
        <div className="label-tiny">Diet</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
          {today === todayISO() ? "Today's meals" : "Logged meals"}
        </h1>
      </div>

      {/* Hero summary */}
      <div className="card-elev p-5">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Ring
              pct={Math.min(1, totals.cal / target)}
              color="#22d3ee"
              size={88}
              stroke={8}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-base font-black text-chalk-50">
                  {totals.cal}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-chalk-400">
                  / {target.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="label-tiny">Calories</div>
            <div className="text-2xl font-black text-chalk-50">
              {totals.cal.toLocaleString()}
            </div>
            <div className="text-xs text-chalk-400">
              {Math.max(0, target - totals.cal).toLocaleString()} cal left ·{" "}
              {Math.round((totals.cal / target) * 100)}%
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <MacroPill
            label="Protein"
            v={totals.p}
            goal={stats.proteinG}
            color="#a78bfa"
          />
          <MacroPill
            label="Carbs"
            v={totals.c}
            goal={stats.workoutMacros.carbG}
            color="#22d3ee"
          />
          <MacroPill
            label="Fat"
            v={totals.f}
            goal={stats.workoutMacros.fatG}
            color="#fbbf24"
          />
        </div>
      </div>

      {/* Recipes link */}
      <Link
        href="/diet/recipes"
        className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 hover:bg-white/[0.05]"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-accent-cyan" />
          <div>
            <div className="text-sm font-bold text-chalk-50">
              Recipe library
            </div>
            <div className="text-xs text-chalk-400">
              {rcps.length} saved · one-tap log next time
            </div>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-chalk-400" />
      </Link>

      {/* Meal sections */}
      <div className="space-y-3">
        {grouped.map(({ meal, entries }) => {
          const Icon = MEAL_ICONS[meal];
          const mealCal = entries.reduce((s, e) => s + e.calories, 0);
          return (
            <div key={meal} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-chalk-300" />
                  <div className="text-sm font-bold capitalize text-chalk-50">
                    {meal}
                  </div>
                  {mealCal > 0 ? (
                    <div className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold text-chalk-300">
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
                <div className="mt-3 text-xs text-chalk-500">
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
          );
        })}
      </div>
    </div>
  );
}

function MacroPill({
  label,
  v,
  goal,
  color,
}: {
  label: string;
  v: number;
  goal: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="label-tiny">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <div className="text-xl font-extrabold" style={{ color }}>
          {v}
        </div>
        <div className="text-[10px] text-chalk-400">/ {goal}g</div>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(100, (v / Math.max(1, goal)) * 100)}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
