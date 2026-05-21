"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { toISODate } from "@/lib/dates";

export interface CalendarDay {
  date: string; // ISO yyyy-mm-dd
  hasEntry: boolean;
  workoutCompleted: boolean;
  hitCalories: boolean;
}

export function Calendar({
  days,
  selectedDate,
  onSelect,
}: {
  days: CalendarDay[];
  selectedDate: string;
  onSelect?: (date: string) => void;
}) {
  const today = useMemo(() => toISODate(new Date()), []);
  const [month, setMonth] = useState(() => {
    const d = new Date(selectedDate);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const grid = useMemo(() => buildGrid(month), [month]);
  const byDate = useMemo(
    () => Object.fromEntries(days.map((d) => [d.date, d])),
    [days],
  );

  const label = month.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-extrabold text-chalk-50">{label}</div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
            className="rounded-lg p-1.5 text-chalk-400 hover:bg-white/5 hover:text-chalk-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
            className="rounded-lg p-1.5 text-chalk-400 hover:bg-white/5 hover:text-chalk-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
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
          const info = byDate[iso];
          const isToday = iso === today;
          const isSelected = iso === selectedDate;
          const future = iso > today;
          return (
            <button
              key={i}
              type="button"
              disabled={future}
              onClick={() => onSelect?.(iso)}
              className={cn(
                "relative aspect-square rounded-lg border text-[12px] font-bold transition disabled:opacity-30 disabled:cursor-not-allowed",
                isSelected
                  ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan"
                  : info?.hasEntry
                    ? "border-white/15 bg-white/[0.06] text-chalk-50"
                    : "border-white/[0.05] bg-transparent text-chalk-400 hover:bg-white/[0.03]",
                isToday && !isSelected && "ring-1 ring-accent-cyan/40",
              )}
            >
              {d.getDate()}
              <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-0.5">
                {info?.hitCalories ? (
                  <span className="h-1 w-1 rounded-full bg-accent-green" />
                ) : null}
                {info?.workoutCompleted ? (
                  <span className="h-1 w-1 rounded-full bg-accent-violet" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-end gap-3 text-[10px] text-chalk-400">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-green" /> Calories
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-violet" /> Workout
        </span>
      </div>
    </div>
  );
}

function buildGrid(month: Date): (Date | null)[] {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const lead = start.getDay();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let i = 1; i <= end.getDate(); i++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), i));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
