"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Loader2,
  Salad,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { fromISODate, toISODate, todayISO } from "@/lib/dates";
import {
  getActivityYear,
  type YearActivity,
} from "@/lib/actions/activity";
import { CalendarStats } from "@/components/CalendarStats";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// How many past years the year dropdown lists. Cheap to bump later if anyone
// is using the app for that long.
const YEARS_BACK = 10;

export function Calendar({
  initial,
  selectedDate,
}: {
  initial: YearActivity;
  selectedDate: string;
}) {
  const router = useRouter();
  const today = todayISO();
  const todayDate = useMemo(() => fromISODate(today), [today]);
  const initialDate = useMemo(() => fromISODate(selectedDate), [selectedDate]);

  const [year, setYear] = useState(initialDate.getFullYear());
  const [month, setMonth] = useState(initialDate.getMonth());
  const [showYears, setShowYears] = useState(false);

  // Follow the selected date across client-side navigations (day-nav chips,
  // calendar taps) — the component stays mounted, so state alone would leave
  // the grid stuck on the mount-time month.
  useEffect(() => {
    setYear(initialDate.getFullYear());
    setMonth(initialDate.getMonth());
  }, [initialDate]);

  // Client-side per-year cache so navigating month-by-month (or back to a
  // previously-viewed year) doesn't refetch.
  const [cache, setCache] = useState<Record<number, YearActivity>>({
    [initial.year]: initial,
  });
  const [pending, start] = useTransition();

  const data = cache[year];

  useEffect(() => {
    if (cache[year]) return;
    start(async () => {
      const fresh = await getActivityYear(year);
      setCache((c) => ({ ...c, [year]: fresh }));
    });
  }, [year, cache]);

  const workoutSet = useMemo(() => new Set(data?.workoutDays ?? []), [data]);
  const dietSet = useMemo(() => new Set(data?.dietDays ?? []), [data]);
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const monthStats = useMemo(
    () => computeMonthStats(year, month, workoutSet, dietSet),
    [year, month, workoutSet, dietSet],
  );

  const yearOptions = useMemo(() => {
    const cy = todayDate.getFullYear();
    const out: number[] = [];
    for (let y = cy; y >= cy - YEARS_BACK + 1; y--) out.push(y);
    return out;
  }, [todayDate]);

  const canGoNext = !(
    year > todayDate.getFullYear() ||
    (year === todayDate.getFullYear() && month >= todayDate.getMonth())
  );

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (!canGoNext) return;
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowYears((v) => !v)}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full px-3 text-[15px] font-bold text-white transition-all duration-200 ease-ios active:scale-[0.97] hover:bg-white/[0.06]"
            aria-expanded={showYears}
          >
            {MONTH_NAMES[month]} {year}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-chalk-400 transition-transform",
                showYears && "rotate-180",
              )}
            />
          </button>
          {pending && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-chalk-400" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="grid h-9 w-9 place-items-center rounded-full text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-white/[0.06] hover:text-white"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            disabled={!canGoNext}
            className="grid h-9 w-9 place-items-center rounded-full text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showYears && (
        <div className="mb-4 grid grid-cols-5 gap-1.5 rounded-2xl bg-ink-800 p-2">
          {yearOptions.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setYear(y);
                setShowYears(false);
              }}
              className={cn(
                "min-h-[36px] rounded-full text-[12px] font-semibold transition-all duration-200 ease-ios active:scale-[0.96]",
                y === year
                  ? "bg-accent-blue/20 text-accent-blue"
                  : "text-chalk-300 hover:bg-white/[0.06]",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="metric-label">This month</span>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <MonthStat
            label="Workouts"
            value={monthStats.workouts}
            Icon={Dumbbell}
            color="#30D158"
          />
          <MonthStat
            label="Nutrition"
            value={monthStats.diet}
            Icon={Salad}
            color="#FF9F0A"
          />
          <CalendarStats />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-chalk-400">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square" />;
          const iso = toISODate(d);
          const hasWorkout = workoutSet.has(iso);
          const hasDiet = dietSet.has(iso);
          const hasAny = hasWorkout || hasDiet;
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const future = iso > today;
          return (
            <button
              key={i}
              type="button"
              disabled={future}
              onClick={() => router.push(`/overview?date=${iso}`)}
              className={cn(
                "relative aspect-square rounded-xl text-[13px] font-semibold transition-all duration-200 ease-ios active:scale-[0.93] disabled:cursor-not-allowed disabled:opacity-30",
                isSelected
                  ? "bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40"
                  : hasAny
                    ? "bg-ink-800 text-white hover:bg-ink-700"
                    : "bg-transparent text-chalk-400 hover:bg-white/[0.04]",
                isToday && !isSelected && "ring-1 ring-white/30",
              )}
            >
              {d.getDate()}
              <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-0.5">
                {hasDiet && (
                  <span className="h-1 w-1 rounded-full bg-accent-orange" />
                )}
                {hasWorkout && (
                  <span className="h-1 w-1 rounded-full bg-accent-green" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-4 text-[11px] font-medium text-chalk-400">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-orange" />
          Nutrition
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green" />
          Workout
        </span>
      </div>
    </div>
  );
}

function MonthStat({
  label,
  value,
  Icon,
  color,
}: {
  label: string;
  value: number;
  Icon: typeof Dumbbell;
  color: string;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl bg-ink-800 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
        <span className="truncate metric-label">{label}</span>
      </div>
      <span
        className="font-display text-[22px] font-black leading-none tracking-tightest"
        style={{ color }}
      >
        {value}
      </span>
    </div>
  );
}

function computeMonthStats(
  year: number,
  month: number,
  workoutSet: Set<string>,
  dietSet: Set<string>,
): { workouts: number; diet: number } {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let workouts = 0;
  let diet = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = toISODate(new Date(year, month, d));
    if (workoutSet.has(iso)) workouts++;
    if (dietSet.has(iso)) diet++;
  }
  return { workouts, diet };
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const lead = start.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let i = 1; i <= end.getDate(); i++) {
    cells.push(new Date(year, month, i));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
