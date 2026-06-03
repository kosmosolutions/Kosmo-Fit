import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dailyCalorieTarget, dayIndexForDate } from "@/lib/calc";
import { Ring } from "@/components/Ring";
import { Calendar } from "@/components/Calendar";
import { getActivityYear } from "@/lib/actions/activity";
import { getWeightHistory } from "@/lib/actions/weight";
import { DailyTrackerForm } from "@/components/DailyTrackerForm";
import { GapMeter } from "@/components/GapMeter";
import { WeightTrendChart } from "@/components/WeightTrendChart";
import { fromISODate, toISODate } from "@/lib/dates";
import { localTodayISO } from "@/lib/serverDate";
import { getDays } from "@/data/workouts";
import { ArrowRight, ChevronLeft, ChevronRight, Footprints, Flame } from "lucide-react";

// Apple Fitness palette
const MOVE = "#FF2D55";   // calories burned / movement
const EXERCISE = "#30D158"; // strength / workout
const STAND = "#0A84FF";  // hydration / activity
const DIET = "#FF9F0A";   // nutrition / total cals
const PROTEIN = "#FF375F";
const CARBS = "#FF9F0A";
const FAT = "#FFD60A";

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const todayLocal = await localTodayISO();
  const selected = dateParam ?? todayLocal;

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

  const eaten = (food ?? []).reduce((s, e) => s + e.calories, 0);
  const protein = (food ?? []).reduce((s, e) => s + e.protein_g, 0);
  const carbs = (food ?? []).reduce((s, e) => s + e.carbs_g, 0);
  const fat = (food ?? []).reduce((s, e) => s + e.fat_g, 0);

  const selectedDate = fromISODate(selected);
  const dayIdx = dayIndexForDate(selectedDate);

  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateISO = toISODate(prevDate);
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateISO = toISODate(nextDate);
  const isToday = selected === todayLocal;
  const mode = profile.workout_mode === "gym" ? ("gym" as const) : ("home" as const);
  const stats = calcStats(profile, mode);
  const days = getDays(mode);

  const burn = dayIdx >= 0 ? stats.burns[dayIdx] : 0;
  const day = dayIdx >= 0 ? days[dayIdx] : null;

  const cardioBurn = daily?.cardio_calories ?? 0;
  const workoutDone = !!daily?.workout_completed;
  const totalBurn = (workoutDone ? burn : 0) + cardioBurn;
  const target = dailyCalorieTarget(stats, dayIdx, workoutDone, cardioBurn);
  const earnable = !workoutDone && burn > 0 ? burn : 0;

  const protGoal = stats.proteinG;
  const carbGoal = stats.workoutMacros.carbG;
  const fatGoal = stats.workoutMacros.fatG;
  const stepGoal = profile.daily_step_goal;
  const pctEaten = Math.min(1, eaten / target);
  const stepPct = Math.min(100, ((daily?.steps ?? 0) / Math.max(1, stepGoal)) * 100);

  return (
    <div className="space-y-4">
      {/* Date heading + day navigator */}
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
            <div className="metric-label">
              {isToday ? "Today" : "Logged day"}
            </div>
            <h1 className="display truncate text-[26px] leading-tight text-white sm:text-[30px]">
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
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: day.color }}
            >
              {day.icon} {day.focus} day · {day.duration}
            </div>
          ) : (
            <div className="text-xs font-semibold text-chalk-400">
              😴 Rest day
            </div>
          )}
          {!isToday && (
            <Link
              href="/overview"
              className="inline-flex items-center gap-1 rounded-full bg-accent-blue/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-blue transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-accent-blue/25"
            >
              Jump to today
            </Link>
          )}
        </div>
      </div>

      {/* Hero bento: calorie ring + earned + macros */}
      <section className="card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-accent-orange" />
              <span className="metric-label text-accent-orange">
                Calorie target
              </span>
            </div>
            <div className="metric-value mt-1">{target.toLocaleString()}</div>
            <div className="mt-1 text-[13px] font-medium text-chalk-300">
              {eaten.toLocaleString()} eaten ·{" "}
              <span className="text-accent-rose">
                {totalBurn.toLocaleString()} burn
              </span>
            </div>
            {earnable > 0 ? (
              <div className="mt-1.5 text-[11px] font-semibold text-accent-green">
                Complete today's workout to add +{earnable} cal
              </div>
            ) : null}
          </div>
          <div className="relative shrink-0">
            <Ring pct={pctEaten} color={DIET} size={108} stroke={11} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[22px] font-black leading-none text-white">
                  {Math.round(pctEaten * 100)}%
                </div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-chalk-400">
                  of target
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="metric-label mb-3">Macros</div>
          <div className="grid grid-cols-3 gap-3">
            <MacroRing label="Protein" g={protein} goal={protGoal} color={PROTEIN} />
            <MacroRing label="Carbs" g={carbs} goal={carbGoal} color={CARBS} />
            <MacroRing label="Fat" g={fat} goal={fatGoal} color={FAT} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Link
            href={isToday ? "/diet" : `/diet?date=${selected}`}
            className="group flex min-h-[88px] flex-col justify-between rounded-2xl bg-ink-800 p-4 transition-all duration-200 ease-ios active:scale-[0.98] hover:bg-ink-700"
            aria-label="Log a meal"
          >
            <div>
              <div className="text-[15px] font-bold text-white">Log meal</div>
              <div className="mt-0.5 text-[12px] font-medium text-chalk-400">
                {eaten >= target
                  ? `${(eaten - target).toLocaleString()} over today`
                  : `${(target - eaten).toLocaleString()} cal left`}
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-accent-orange">
              Open nutrition <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
          <Link
            href={isToday ? "/workout" : `/workout?date=${selected}`}
            className="group flex min-h-[88px] flex-col justify-between rounded-2xl bg-ink-800 p-4 transition-all duration-200 ease-ios active:scale-[0.98] hover:bg-ink-700"
            aria-label="Log workout"
          >
            <div>
              <div className="text-[15px] font-bold text-white">
                Log workout
              </div>
              <div className="mt-0.5 text-[12px] font-medium text-chalk-400">
                {day == null
                  ? "Rest day"
                  : workoutDone
                    ? `Completed · +${burn} earned`
                    : `Earn +${burn} cal`}
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-accent-green">
              Open fitness <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </section>

      <GapMeter
        eaten={eaten}
        burned={totalBurn}
        target={target}
        weight={profile.current_weight}
      />

      <WeightTrendChart
        points={weightHistory}
        currentWeight={Number(profile.current_weight) || 0}
        goalWeight={Number(profile.goal_weight) || 0}
        windowDays={90}
      />

      <DailyTrackerForm
        entryDate={selected}
        bodyWeightLbs={Number(profile.current_weight) || 0}
        initial={{
          weight: daily?.weight ?? null,
          steps: daily?.steps ?? 0,
          cardio_minutes: daily?.cardio_minutes ?? 0,
          cardio_calories: daily?.cardio_calories ?? 0,
          cardio_type: daily?.cardio_type ?? null,
          workout_completed: !!daily?.workout_completed,
          water_oz: daily?.water_oz ?? 0,
          sleep_hours: daily?.sleep_hours ?? null,
          mood: daily?.mood ?? null,
          notes: daily?.notes ?? null,
        }}
      />

      {/* Steps bento */}
      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="grid h-11 w-11 place-items-center rounded-full"
              style={{ background: `${STAND}22` }}
            >
              <Footprints className="h-5 w-5" style={{ color: STAND }} />
            </div>
            <div>
              <div className="metric-label">Steps</div>
              <div className="text-[28px] font-black leading-tight tracking-tightest text-white">
                {(daily?.steps ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[18px] font-bold" style={{ color: STAND }}>
              {Math.round(((daily?.steps ?? 0) / Math.max(1, stepGoal)) * 100)}%
            </div>
            <div className="text-[11px] font-medium text-chalk-400">
              goal {stepGoal.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full transition-all duration-500 ease-ios"
            style={{
              width: `${stepPct}%`,
              background: `linear-gradient(90deg, ${STAND} 0%, #5AC8FA 100%)`,
            }}
          />
        </div>
      </section>

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
    "flex min-h-[44px] shrink-0 items-center gap-1 rounded-full bg-ink-850 px-3 text-[12px] font-semibold text-chalk-200 transition-all duration-200 ease-ios active:scale-[0.96]";
  if (disabled) {
    return (
      <div
        aria-disabled
        className={`${baseClasses} cursor-not-allowed opacity-40`}
      >
        {direction === "prev" && <Icon className="h-4 w-4" />}
        <span className="hidden sm:inline">{label}</span>
        {direction === "next" && <Icon className="h-4 w-4" />}
      </div>
    );
  }
  return (
    <Link
      href={href}
      aria-label={`Go to ${label}`}
      className={`${baseClasses} hover:bg-ink-800 hover:text-white`}
    >
      {direction === "prev" && <Icon className="h-4 w-4" />}
      <span className="hidden sm:inline">{label}</span>
      {direction === "next" && <Icon className="h-4 w-4" />}
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
        <Ring pct={g / Math.max(1, goal)} color={color} size={72} stroke={7} />
        <div className="absolute inset-0 grid place-items-center">
          <div>
            <div
              className="text-[15px] font-black leading-none"
              style={{ color }}
            >
              {g}
              <span className="ml-0.5 text-[10px] font-semibold text-chalk-400">
                g
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 text-[12px] font-semibold text-white">{label}</div>
      <div className="text-[10px] font-medium text-chalk-400">/ {goal}g</div>
    </div>
  );
}
