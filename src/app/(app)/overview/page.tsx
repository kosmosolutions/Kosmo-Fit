import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calcStats, dailyCalorieTarget } from "@/lib/calc";
import { resolvePlanDay } from "@/lib/planDay";
import { Ring } from "@/components/Ring";
import { Calendar } from "@/components/Calendar";
import { getActivityYear } from "@/lib/actions/activity";
import { getWeightHistory } from "@/lib/actions/weight";
import { DailyTrackerForm } from "@/components/DailyTrackerForm";
import { GapMeter } from "@/components/GapMeter";
import { FocusIcon } from "@/components/FocusIcon";
import { WeightTrendChart } from "@/components/WeightTrendChart";
import { fromISODate, toISODate } from "@/lib/dates";
import { localTodayISO } from "@/lib/serverDate";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flame,
  Dumbbell,
} from "lucide-react";

// Apple Fitness palette
const MOVE = "#FF2D55";   // calories burned / movement
const EXERCISE = "#30D158"; // strength / workout
const DIET = "#D9A441";   // nutrition / total cals — muted posh amber
const PROTEIN = "#FF375F";
const CARBS = "#D9A441";
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

  const [{ data: daily }, { data: food }, heatmapData, weightHistory, { data: activePlan }] =
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
      profile.active_plan_id
        ? supabase
            .from("workout_plans")
            .select("id, base_template_id, is_built, days")
            .eq("user_id", user.id)
            .eq("id", profile.active_plan_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const eaten = (food ?? []).reduce((s, e) => s + e.calories, 0);
  const protein = (food ?? []).reduce((s, e) => s + e.protein_g, 0);
  const carbs = (food ?? []).reduce((s, e) => s + e.carbs_g, 0);
  const fat = (food ?? []).reduce((s, e) => s + e.fat_g, 0);

  const selectedDate = fromISODate(selected);

  const prevDate = new Date(selectedDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateISO = toISODate(prevDate);
  const nextDate = new Date(selectedDate);
  nextDate.setDate(nextDate.getDate() + 1);
  const nextDateISO = toISODate(nextDate);
  const isToday = selected === todayLocal;
  const mode = profile.workout_mode === "gym" ? ("gym" as const) : ("home" as const);
  const stats = calcStats(profile, mode);

  // Resolve the selected date against the user's ACTIVE plan (built plan,
  // template, or legacy split) so this page agrees with the workout screen
  // about which days train and what completing them earns.
  const { day, burn } = resolvePlanDay({
    date: selectedDate,
    mode,
    activeTemplateId: activePlan
      ? activePlan.base_template_id
      : (profile.active_template_id ?? null),
    builtDays: activePlan?.is_built ? (activePlan.days ?? null) : null,
  });

  const cardioBurn = daily?.cardio_calories ?? 0;
  const workoutDone = !!daily?.workout_completed;
  const totalBurn = (workoutDone ? burn : 0) + cardioBurn;
  const target = dailyCalorieTarget(stats, burn, workoutDone, cardioBurn);
  const earnable = !workoutDone && burn > 0 ? burn : 0;

  const protGoal = stats.proteinG;
  const carbGoal = stats.workoutMacros.carbG;
  const fatGoal = stats.workoutMacros.fatG;
  const stepGoal = profile.daily_step_goal;
  const pctEaten = Math.min(1, eaten / target);

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
              <FocusIcon focus={day.focus} className="h-3.5 w-3.5" />
              {day.focus} day · {day.duration}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-chalk-400">
              <FocusIcon focus="Rest" className="h-3.5 w-3.5" />
              Rest day
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
            <Ring pct={pctEaten} color={DIET} size={120} stroke={12} />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[25px] font-black leading-none text-white">
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
            className="group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-2xl bg-ink-800 p-4 transition-all duration-200 ease-ios active:scale-[0.98] hover:bg-ink-700"
            aria-label="Log a meal"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl"
              style={{ background: `${DIET}24` }}
            />
            <div className="relative flex items-center justify-between">
              <span
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: `${DIET}1f` }}
              >
                <Flame className="h-[18px] w-[18px]" style={{ color: DIET }} />
              </span>
              <ArrowRight className="h-4 w-4 text-chalk-500 transition-transform duration-200 ease-ios group-hover:translate-x-0.5" />
            </div>
            <div className="relative">
              <div className="text-[15px] font-bold text-white">Log meal</div>
              <div className="mt-0.5 text-[12px] font-medium text-chalk-400">
                {eaten >= target
                  ? `${(eaten - target).toLocaleString()} over today`
                  : `${(target - eaten).toLocaleString()} cal left`}
              </div>
            </div>
          </Link>
          <Link
            href={isToday ? "/workout" : `/workout?date=${selected}`}
            className="group relative flex min-h-[112px] flex-col justify-between overflow-hidden rounded-2xl bg-ink-800 p-4 transition-all duration-200 ease-ios active:scale-[0.98] hover:bg-ink-700"
            aria-label="Log workout"
          >
            <div
              className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-3xl"
              style={{ background: `${EXERCISE}24` }}
            />
            <div className="relative flex items-center justify-between">
              <span
                className="grid h-9 w-9 place-items-center rounded-full"
                style={{ background: `${EXERCISE}1f` }}
              >
                <Dumbbell
                  className="h-[18px] w-[18px]"
                  style={{ color: EXERCISE }}
                />
              </span>
              <ArrowRight className="h-4 w-4 text-chalk-500 transition-transform duration-200 ease-ios group-hover:translate-x-0.5" />
            </div>
            <div className="relative">
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
        todayISO={todayLocal}
        plannedWeeklyLoss={stats.weeklyLoss}
        planHref="/profile"
      />

      <DailyTrackerForm
        key={selected}
        entryDate={selected}
        isToday={isToday}
        bodyWeightLbs={Number(profile.current_weight) || 0}
        stepGoal={stepGoal}
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
          photo_url: daily?.photo_url ?? null,
        }}
      />

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
        <Ring pct={g / Math.max(1, goal)} color={color} size={76} stroke={8} />
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
