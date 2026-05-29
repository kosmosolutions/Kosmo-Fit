import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dayIndexForDate } from "@/lib/calc";
import { fromISODate, todayISO } from "@/lib/dates";
import { AddMealDialog } from "@/components/AddMealDialog";
import { FoodEntryRow } from "@/components/FoodEntryRow";
import type { FoodEntry, MealType, Recipe } from "@/lib/types";
import { BookOpen, Sunrise, Coffee, Soup, Moon, Flame } from "lucide-react";

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

  const over = totals.cal > target;
  const calPct = Math.min(100, Math.round((totals.cal / Math.max(1, target)) * 100));
  // Default the top-level CTA to the next meal that still has nothing logged.
  const nextMeal = grouped.find((g) => g.entries.length === 0)?.meal ?? "breakfast";

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label-tiny">Diet</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
            {today === todayISO() ? "Today's meals" : "Logged meals"}
          </h1>
        </div>
        <Link
          href="/diet/recipes"
          className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-chalk-200 transition hover:bg-white/10"
        >
          <BookOpen className="h-3.5 w-3.5 text-accent-cyan" />
          Recipes
          <span className="text-chalk-500">{rcps.length}</span>
        </Link>
      </div>

      {/* Calorie scoreboard */}
      <div className="card-elev p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-accent-cyan" />
              <span className="label-tiny text-accent-cyan">Calories</span>
            </div>
            <div className="mt-1 text-4xl font-black tracking-tight text-chalk-50">
              {totals.cal.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-chalk-400">
              of {target.toLocaleString()} cal
            </div>
            <div
              className={
                over
                  ? "text-sm font-bold text-accent-amber"
                  : "text-sm font-bold text-accent-cyan"
              }
            >
              {over
                ? `${(totals.cal - target).toLocaleString()} over`
                : `${(target - totals.cal).toLocaleString()} left`}{" "}
              · {calPct}%
            </div>
          </div>
        </div>

        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${calPct}%`,
              background: over ? "#fbbf24" : "#22d3ee",
            }}
          />
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="label-tiny mb-3">Macros</div>
          <div className="space-y-3">
            <MacroBar label="Protein" v={totals.p} goal={stats.proteinG} color="#a78bfa" />
            <MacroBar
              label="Carbs"
              v={totals.c}
              goal={stats.workoutMacros.carbG}
              color="#22d3ee"
            />
            <MacroBar
              label="Fat"
              v={totals.f}
              goal={stats.workoutMacros.fatG}
              color="#fbbf24"
            />
          </div>
        </div>
      </div>

      {/* Primary action */}
      <AddMealDialog
        entryDate={today}
        recipes={rcps}
        defaultMeal={nextMeal}
        triggerVariant="primary"
        triggerLabel="Log food"
      />

      {/* Meal timeline */}
      <ol className="relative space-y-3">
        <span
          aria-hidden
          className="absolute bottom-5 left-[19px] top-5 w-px bg-white/[0.08]"
        />
        {grouped.map(({ meal, entries }) => {
          const Icon = MEAL_ICONS[meal];
          const mealCal = entries.reduce((s, e) => s + e.calories, 0);
          return (
            <li key={meal} className="relative flex gap-3">
              <div className="relative z-10 mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-900 ring-1 ring-white/10">
                <Icon className="h-4 w-4 text-chalk-300" />
              </div>
              <div className="card min-w-0 flex-1 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MacroBar({
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
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color }}>
          {label}
        </span>
        <span className="text-[11px] text-chalk-400">
          {v} / {goal}g
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
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
