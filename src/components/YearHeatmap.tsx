"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { toISODate, todayISO } from "@/lib/dates";
import {
  getActivityYear,
  type YearActivity,
} from "@/lib/actions/activity";

// Cell + gap sizes are duplicated here and in the inline style below — the
// month labels need pixel alignment with the columns underneath them.
const CELL = 12;
const GAP = 2;
const COL = CELL + GAP;
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function YearHeatmap({
  initial,
  selectedDate,
}: {
  initial: YearActivity;
  selectedDate: string;
}) {
  const router = useRouter();
  const [year, setYear] = useState(initial.year);
  // Client-side cache of years we've already fetched so toggling back and
  // forth doesn't hit the database every time.
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

  const grid = useMemo(() => buildYearGrid(year), [year]);
  const workoutSet = useMemo(
    () => new Set(data?.workoutDays ?? []),
    [data],
  );
  const dietSet = useMemo(() => new Set(data?.dietDays ?? []), [data]);

  const today = todayISO();
  const currentYear = new Date().getFullYear();

  const totalCols = grid.weeks.length;
  const gridWidth = totalCols * COL - GAP;

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-sm font-extrabold text-chalk-50">{year}</div>
          {pending && (
            <Loader2 className="h-3 w-3 animate-spin text-chalk-400" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            className="rounded-lg p-1.5 text-chalk-400 hover:bg-white/5 hover:text-chalk-100"
            aria-label="Previous year"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={year >= currentYear}
            onClick={() => setYear((y) => y + 1)}
            className="rounded-lg p-1.5 text-chalk-400 hover:bg-white/5 hover:text-chalk-100 disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Next year"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll on mobile — 52 weeks × 14px ≈ 730px, wider than
          any phone. Standard GitHub-style overflow. */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels row, absolutely positioned to align with the first
              week of each month. */}
          <div
            className="relative ml-7 h-4"
            style={{ width: `${gridWidth}px` }}
          >
            {grid.monthStarts.map((m, i) => {
              const nextStart =
                grid.monthStarts[i + 1]?.weekIdx ?? totalCols;
              const widthPx = (nextStart - m.weekIdx) * COL - GAP;
              // Skip the label if it'd be narrower than ~"Jan" to avoid
              // overlapping the next month.
              if (widthPx < 20) return null;
              return (
                <span
                  key={m.month}
                  className="absolute top-0 text-[9px] font-bold uppercase tracking-wider text-chalk-500"
                  style={{ left: `${m.weekIdx * COL}px` }}
                >
                  {MONTH_LABELS[m.month]}
                </span>
              );
            })}
          </div>

          <div className="flex" style={{ gap: `${GAP}px` }}>
            {/* Day-of-week labels (sparse — Mon/Wed/Fri) */}
            <div
              className="mr-1 flex flex-col text-[9px] font-bold text-chalk-500"
              style={{ gap: `${GAP}px` }}
            >
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <div
                  key={i}
                  className="flex items-center"
                  style={{ height: `${CELL}px`, width: "18px" }}
                >
                  {d}
                </div>
              ))}
            </div>

            {grid.weeks.map((week, weekIdx) => (
              <div
                key={weekIdx}
                className="flex flex-col"
                style={{ gap: `${GAP}px` }}
              >
                {week.map((d, dayIdx) => {
                  if (!d) {
                    return (
                      <div
                        key={dayIdx}
                        style={{ height: `${CELL}px`, width: `${CELL}px` }}
                      />
                    );
                  }
                  const iso = toISODate(d);
                  const hasWorkout = workoutSet.has(iso);
                  const hasDiet = dietSet.has(iso);
                  const isToday = iso === today;
                  const isSelected = iso === selectedDate;
                  const future = iso > today;
                  return (
                    <button
                      key={dayIdx}
                      type="button"
                      disabled={future}
                      onClick={() =>
                        router.push(`/overview?date=${iso}`)
                      }
                      title={dayTitle(iso, hasWorkout, hasDiet)}
                      style={{
                        height: `${CELL}px`,
                        width: `${CELL}px`,
                      }}
                      className={cn(
                        "rounded-sm transition disabled:cursor-not-allowed disabled:opacity-20",
                        cellClass(hasWorkout, hasDiet),
                        isSelected && "ring-2 ring-accent-cyan ring-offset-1 ring-offset-ink-900",
                        isToday &&
                          !isSelected &&
                          "ring-1 ring-accent-cyan/50",
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-[10px] text-chalk-400">
        <Swatch className="bg-white/[0.06]" label="No log" />
        <Swatch className="bg-accent-violet/70" label="Workout" />
        <Swatch className="bg-accent-cyan/70" label="Diet" />
        <Swatch
          className="bg-gradient-to-br from-accent-violet to-accent-cyan"
          label="Both"
        />
      </div>
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("h-2.5 w-2.5 rounded-sm", className)} />
      {label}
    </span>
  );
}

function cellClass(workout: boolean, diet: boolean): string {
  if (workout && diet)
    return "bg-gradient-to-br from-accent-violet to-accent-cyan";
  if (workout) return "bg-accent-violet/70 hover:bg-accent-violet";
  if (diet) return "bg-accent-cyan/70 hover:bg-accent-cyan";
  return "bg-white/[0.06] hover:bg-white/15";
}

function dayTitle(iso: string, workout: boolean, diet: boolean): string {
  const parts: string[] = [iso];
  if (workout) parts.push("workout");
  if (diet) parts.push("diet logged");
  return parts.join(" · ");
}

// Builds a 7-row × ~53-col layout: each column is a Sunday→Saturday week,
// each cell is a day. Days outside `year` are returned as null so the grid
// keeps the proper week alignment at year boundaries.
function buildYearGrid(year: number): {
  weeks: (Date | null)[][];
  monthStarts: { month: number; weekIdx: number }[];
} {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  // Anchor the grid on the Sunday before (or on) Jan 1.
  const startSun = new Date(jan1);
  startSun.setDate(jan1.getDate() - jan1.getDay());
  // Extend through the Saturday after (or on) Dec 31.
  const endSat = new Date(dec31);
  endSat.setDate(dec31.getDate() + (6 - dec31.getDay()));

  const weeks: (Date | null)[][] = [];
  const cursor = new Date(startSun);
  while (cursor <= endSat) {
    const week: (Date | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(
        cursor.getFullYear() === year
          ? new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())
          : null,
      );
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // For each month, find the week column index containing its 1st.
  const monthStarts: { month: number; weekIdx: number }[] = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1);
    const daysFromStart = Math.round(
      (first.getTime() - startSun.getTime()) / 86_400_000,
    );
    monthStarts.push({ month: m, weekIdx: Math.floor(daysFromStart / 7) });
  }

  return { weeks, monthStarts };
}
