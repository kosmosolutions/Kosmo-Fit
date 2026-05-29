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
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowYears((v) => !v)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-extrabold text-chalk-50 hover:bg-white/5"
            aria-expanded={showYears}
          >
            {MONTH_NAMES[month]} {year}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-chalk-400 transition",
                showYears && "rotate-180",
              )}
            />
          </button>
          {pending && (
            <Loader2 className="h-3 w-3 animate-spin text-chalk-400" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-1.5 text-chalk-400 hover:bg-white/5 hover:text-chalk-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            disabled={!canGoNext}
            className="rounded-lg p-1.5 text-chalk-400 hover:bg-white/5 hover:text-chalk-100 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showYears && (
        <div className="mb-3 grid grid-cols-5 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-2">
          {yearOptions.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => {
                setYear(y);
                setShowYears(false);
              }}
              className={cn(
                "rounded-lg px-2 py-1.5 text-xs font-bold transition",
                y === year
                  ? "bg-accent-cyan/15 text-accent-cyan"
                  : "text-chalk-300 hover:bg-white/5",
              )}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      <div className="mb-3">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="label-tiny">This month</span>
        </div>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5">
          <MonthStat
            label="Workouts"
            value={monthStats.workouts}
            Icon={Dumbbell}
            color="#a78bfa"
          />
          <MonthStat
            label="Diet"
            value={monthStats.diet}
            Icon={Salad}
            color="#22d3ee"
          />
          <CalendarStats />
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-chalk-500">
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
                "relative aspect-square rounded-lg border text-[12px] font-bold transition disabled:cursor-not-allowed disabled:opacity-30",
                isSelected
                  ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan"
                  : hasAny
                    ? "border-white/15 bg-white/[0.06] text-chalk-50"
                    : "border-white/[0.05] bg-transparent text-chalk-400 hover:bg-white/[0.03]",
                isToday && !isSelected && "ring-1 ring-accent-cyan/40",
              )}
            >
              {d.getDate()}
              <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-0.5">
                {hasDiet && (
                  <span className="h-1 w-1 rounded-full bg-accent-cyan" />
                )}
                {hasWorkout && (
                  <span className="h-1 w-1 rounded-full bg-accent-violet" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-chalk-400">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-cyan" /> Diet
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-violet" /> Workout
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
    <div
      className="flex min-w-0 flex-col gap-0.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-2.5 py-2"
      style={{ borderColor: `${color}22` }}
    >
      <div className="flex items-center gap-1">
        <Icon className="h-3 w-3 shrink-0" style={{ color }} />
        <span className="truncate text-[10px] font-bold uppercase tracking-wider text-chalk-400">
          {label}
        </span>
      </div>
      <span className="text-lg font-black leading-none" style={{ color }}>
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
