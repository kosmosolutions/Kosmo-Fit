import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dayIndexForDate } from "@/lib/calc";
import { Ring } from "@/components/Ring";
import { Calendar } from "@/components/Calendar";
import { getActivityYear } from "@/lib/actions/activity";
import { getWeightHistory } from "@/lib/actions/weight";
import { DailyTrackerForm } from "@/components/DailyTrackerForm";
import { GapMeter } from "@/components/GapMeter";
import { WeightTrendChart } from "@/components/WeightTrendChart";
import { fromISODate, toISODate, todayISO } from "@/lib/dates";
import { getDays } from "@/data/workouts";
import { Sparkles, ArrowRight, ChevronLeft, ChevronRight, Footprints, Flame } from "lucide-react";

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

  const [{ data: daily }, { data: food }, heatmapData, weightHistory] =
    await Promise.all([
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
      getWeightHistory(90),
    ]);

  // Food totals
  const eaten = (food ?? []).reduce((s, e) => s + e.calories, 0);
  const protein = (food ?? []).reduce((s, e) => s + e.protein_g, 0);
  const carbs = (food ?? []).reduce((s, e) => s + e.carbs_g, 0);
  const fat = (food ?? []).reduce((s, e) => s + e.fat_g, 0);

  // Selected day target
  const selectedDate = fromISODate(selected);
  const dayIdx = dayIndexForDate(selectedDate);

  // Day navigator: previous date is always allowed; next is capped at today
  // because the rest of the app assumes no future-day logging.
  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateISO = toISODate(prevDate);
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateISO = toISODate(nextDate);
  const isToday = selected === todayISO();
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
      {/* Greeting with day navigator */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <DayNavLink
            direction="prev"
            href={`/overview?date=${prevDateISO}`}
            label={fromISODate(prevDateISO).toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          />
          <div className="min-w-0 text-center">
            <div className="label-tiny">
              {selected === todayISO() ? "Today" : "Logged day"}
            </div>
            <h1 className="truncate text-xl font-extrabold tracking-tight text-chalk-50 sm:text-2xl">
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h1>
          </div>
          <DayNavLink
            direction="next"
            href={isToday ? "" : `/overview?date=${nextDateISO}`}
            disabled={isToday}
            label={
              isToday
                ? "Today"
                : fromISODate(nextDateISO).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
            }
          />
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          {day ? (
            <div
              className="inline-flex items-center gap-1.5 text-xs font-bold"
              style={{ color: day.color }}
            >
              {day.icon} {day.focus} day · {day.duration}
            </div>
          ) : (
            <div className="text-xs font-bold text-chalk-400">
              😴 Rest day
            </div>
          )}
          {!isToday && (
            <Link
              href="/overview"
              className="inline-flex items-center gap-1 rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan hover:bg-accent-cyan/20"
            >
              Jump to today
            </Link>
          )}
        </div>
      </div>

      {/* Hero: target ring + macros */}
      <div className="card-elev p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-accent-cyan" />
              <span className="label-tiny text-accent-cyan">Calorie target</span>
            </div>
            <div className="mt-1 text-4xl font-black tracking-tight text-chalk-50">
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

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="label-tiny mb-3">Macros</div>
          <div className="grid grid-cols-3 gap-3">
            <MacroRing label="Protein" g={protein} goal={protGoal} color="#a78bfa" />
            <MacroRing label="Carbs" g={carbs} goal={carbGoal} color="#22d3ee" />
            <MacroRing label="Fat" g={fat} goal={fatGoal} color="#fbbf24" />
          </div>
        </div>

        <Link
          href="/diet"
          className="mt-5 flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-4 py-3 transition hover:bg-white/[0.08]"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent-cyan" />
            <span className="text-xs font-medium text-chalk-300">
              {eaten >= target
                ? `${(eaten - target).toLocaleString()} cal over — close it with a walk`
                : `${(target - eaten).toLocaleString()} cal of room left today`}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-accent-cyan">
            Log a meal <ArrowRight className="h-3 w-3" />
          </span>
        </Link>
      </div>

      {/* Gap meter — only when over target */}
      <GapMeter
        eaten={eaten}
        burned={totalBurn}
        target={target}
        weight={profile.current_weight}
      />

      {/* Weight trend chart */}
      <WeightTrendChart
        points={weightHistory}
        currentWeight={Number(profile.current_weight) || 0}
        goalWeight={Number(profile.goal_weight) || 0}
        windowDays={90}
      />

      {/* Daily tracker */}
      <DailyTrackerForm
        entryDate={selected}
        bodyWeightLbs={Number(profile.current_weight) || 0}
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
      <div className="card-elev p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent-cyan/15 ring-1 ring-accent-cyan/30">
              <Footprints className="h-4 w-4 text-accent-cyan" />
            </div>
            <div>
              <div className="label-tiny">Steps</div>
              <div className="text-2xl font-black leading-tight text-chalk-50">
                {(daily?.steps ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-extrabold text-accent-cyan">
              {Math.round(((daily?.steps ?? 0) / Math.max(1, stepGoal)) * 100)}%
            </div>
            <div className="text-[10px] text-chalk-400">
              goal {stepGoal.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-sky-300 transition-all"
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

function DayNavLink({
  direction,
  href,
  label,
  disabled,
}: {
  direction: "prev" | "next";
  href: string;
  label: string;
  disabled?: boolean;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const baseClasses =
    "flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px] font-bold text-chalk-200 transition";
  if (disabled) {
    return (
      <div
        aria-disabled
        className={`${baseClasses} cursor-not-allowed opacity-40`}
      >
        {direction === "prev" && <Icon className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{label}</span>
        {direction === "next" && <Icon className="h-3.5 w-3.5" />}
      </div>
    );
  }
  return (
    <Link
      href={href}
      aria-label={`Go to ${label}`}
      className={`${baseClasses} hover:bg-white/[0.08] hover:text-chalk-50`}
    >
      {direction === "prev" && <Icon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{label}</span>
      {direction === "next" && <Icon className="h-3.5 w-3.5" />}
    </Link>
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

