import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dayIndexForDate } from "@/lib/calc";
import { Ring } from "@/components/Ring";
import { Calendar } from "@/components/Calendar";
import { getActivityYear } from "@/lib/actions/activity";
import { DailyTrackerForm } from "@/components/DailyTrackerForm";
import { GapMeter } from "@/components/GapMeter";
import { fromISODate, todayISO } from "@/lib/dates";
import { getDays } from "@/data/workouts";
import { Sparkles, ArrowRight } from "lucide-react";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const selected = dateParam ?? todayISO();

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

  // Default the heatmap to the year of the selected day (so when viewing a
  // past entry, the calendar starts on that year, not always the current one).
  const heatmapYear = fromISODate(selected).getFullYear();

  const [{ data: daily }, { data: food }, heatmapData] = await Promise.all([
    supabase
      .from("daily_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", selected)
      .maybeSingle(),
    supabase
      .from("food_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", selected),
    getActivityYear(heatmapYear),
  ]);

  // Food totals
  const eaten = (food ?? []).reduce((s, e) => s + e.calories, 0);
  const protein = (food ?? []).reduce((s, e) => s + e.protein_g, 0);
  const carbs = (food ?? []).reduce((s, e) => s + e.carbs_g, 0);
  const fat = (food ?? []).reduce((s, e) => s + e.fat_g, 0);

  // Selected day target
  const selectedDate = fromISODate(selected);
  const dayIdx = dayIndexForDate(selectedDate);
  const mode = profile.workout_mode === "gym" ? ("gym" as const) : ("home" as const);
  const stats = calcStats(profile, mode);
  const days = getDays(mode);

  const target =
    dayIdx >= 0 ? stats.dayTargets[dayIdx] : stats.restTarget;
  const burn = dayIdx >= 0 ? stats.burns[dayIdx] : 0;
  const day = dayIdx >= 0 ? days[dayIdx] : null;

  const cardioBurn = daily?.cardio_calories ?? 0;
  const totalBurn = (daily?.workout_completed ? burn : 0) + cardioBurn;

  const protGoal = stats.proteinG;
  const carbGoal = stats.workoutMacros.carbG;
  const fatGoal = stats.workoutMacros.fatG;
  const stepGoal = profile.daily_step_goal;

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <div className="label-tiny">
          {selected === todayISO() ? "Today" : "Logged day"}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h1>
        {day ? (
          <div
            className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold"
            style={{ color: day.color }}
          >
            {day.icon} {day.focus} day · {day.duration}
          </div>
        ) : (
          <div className="mt-1 text-xs font-bold text-chalk-400">
            😴 Rest day
          </div>
        )}
      </div>

      {/* Hero: target ring + macros */}
      <div className="card-elev p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="label-tiny">Calorie target</div>
            <div className="mt-1 text-4xl font-black text-chalk-50">
              {target.toLocaleString()}
            </div>
            <div className="text-xs text-chalk-400">
              {eaten.toLocaleString()} eaten ·{" "}
              <span className="text-accent-amber">
                {totalBurn.toLocaleString()} burn
              </span>
            </div>
          </div>
          <div className="relative">
            <Ring
              pct={Math.min(1, eaten / target)}
              color="#22d3ee"
              size={96}
              stroke={9}
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-lg font-black text-chalk-50">
                  {Math.round((eaten / target) * 100)}%
                </div>
                <div className="text-[9px] uppercase tracking-widest text-chalk-500">
                  of target
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3">
          <MacroRing label="Protein" g={protein} goal={protGoal} color="#a78bfa" />
          <MacroRing label="Carbs" g={carbs} goal={carbGoal} color="#22d3ee" />
          <MacroRing label="Fat" g={fat} goal={fatGoal} color="#fbbf24" />
        </div>
        <div className="mt-5 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-cyan" />
            <span className="text-xs text-chalk-300">
              {eaten >= target
                ? `${(eaten - target).toLocaleString()} cal over — close it with a walk`
                : `${(target - eaten).toLocaleString()} cal of room`}
            </span>
          </div>
          <Link
            href="/diet"
            className="flex items-center gap-1 text-xs font-bold text-accent-cyan"
          >
            Log a meal <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Gap meter — only when over target */}
      <GapMeter
        eaten={eaten}
        burned={totalBurn}
        target={target}
        weight={profile.current_weight}
      />

      {/* Daily tracker */}
      <DailyTrackerForm
        entryDate={selected}
        initial={{
          weight: daily?.weight ?? null,
          steps: daily?.steps ?? 0,
          cardio_minutes: daily?.cardio_minutes ?? 0,
          cardio_calories: daily?.cardio_calories ?? 0,
          workout_completed: !!daily?.workout_completed,
          water_oz: daily?.water_oz ?? 0,
          sleep_hours: daily?.sleep_hours ?? null,
          mood: daily?.mood ?? null,
          notes: daily?.notes ?? null,
        }}
      />

      {/* Steps progress */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="label-tiny">Steps</div>
          <div className="text-xs text-chalk-400">
            goal {stepGoal.toLocaleString()}
          </div>
        </div>
        <div className="mt-2 text-2xl font-black text-chalk-50">
          {(daily?.steps ?? 0).toLocaleString()}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-accent-cyan to-sky-300 transition-all"
            style={{
              width: `${Math.min(100, ((daily?.steps ?? 0) / stepGoal) * 100)}%`,
            }}
          />
        </div>
      </div>

      <Calendar initial={heatmapData} selectedDate={selected} />
    </div>
  );
}

function MacroRing({
  label,
  g,
  goal,
  color,
}: {
  label: string;
  g: number;
  goal: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative">
        <Ring pct={g / Math.max(1, goal)} color={color} size={64} stroke={6} />
        <div className="absolute inset-0 grid place-items-center">
          <div>
            <div className="text-sm font-black" style={{ color }}>
              {g}
              <span className="text-[9px] text-chalk-500">g</span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-1 text-[11px] font-bold text-chalk-200">{label}</div>
      <div className="text-[10px] text-chalk-400">/ {goal}g</div>
    </div>
  );
}

