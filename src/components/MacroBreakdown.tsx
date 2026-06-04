"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, X } from "lucide-react";
import { Ring } from "@/components/Ring";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import type { FoodEntry } from "@/lib/types";

const DIET = "#D9A441";
const PROTEIN = "#FF375F";
const CARBS = "#D9A441";
const FAT = "#FFD60A";
const OVER = "#FF2D55";

type Metric = "calories" | "protein" | "carbs" | "fat";

const METRIC_META: Record<
  Metric,
  { label: string; unit: string; color: string; field: keyof FoodEntry }
> = {
  calories: { label: "Calories", unit: "cal", color: DIET, field: "calories" },
  protein: { label: "Protein", unit: "g", color: PROTEIN, field: "protein_g" },
  carbs: { label: "Carbs", unit: "g", color: CARBS, field: "carbs_g" },
  fat: { label: "Fat", unit: "g", color: FAT, field: "fat_g" },
};

export function MacroBreakdown({
  entries,
  target,
  proteinGoal,
  carbGoal,
  fatGoal,
}: {
  entries: FoodEntry[];
  target: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
}) {
  const [drill, setDrill] = useState<Metric | null>(null);

  const totals = useMemo(
    () =>
      entries.reduce(
        (acc, e) => {
          acc.cal += e.calories;
          acc.p += e.protein_g;
          acc.c += e.carbs_g;
          acc.f += e.fat_g;
          return acc;
        },
        { cal: 0, p: 0, c: 0, f: 0 },
      ),
    [entries],
  );

  const over = totals.cal > target;
  const calPct = Math.min(100, Math.round((totals.cal / Math.max(1, target)) * 100));

  return (
    <>
      <section className="card p-5">
        {/* Calorie scoreboard — tap to drill into every logged food's calories */}
        <button
          type="button"
          onClick={() => setDrill("calories")}
          className="block w-full text-left transition-all duration-200 ease-ios active:scale-[0.99]"
          aria-label="Break down calories by food"
        >
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" style={{ color: DIET }} />
                <span className="metric-label" style={{ color: DIET }}>
                  Calories
                </span>
              </div>
              <div className="metric-value mt-1" style={{ color: DIET }}>
                {totals.cal.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[12px] font-medium text-chalk-400">
                of {target.toLocaleString()} cal
              </div>
              <div
                className="text-[15px] font-bold"
                style={{ color: over ? OVER : DIET }}
              >
                {over
                  ? `${(totals.cal - target).toLocaleString()} over`
                  : `${(target - totals.cal).toLocaleString()} left`}{" "}
                · {calPct}%
              </div>
            </div>
          </div>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-ios"
              style={{
                width: `${calPct}%`,
                background: over
                  ? `linear-gradient(90deg, ${DIET} 0%, ${OVER} 100%)`
                  : `linear-gradient(90deg, ${FAT} 0%, ${DIET} 100%)`,
              }}
            />
          </div>
        </button>

        <div className="mt-5 border-t border-white/[0.06] pt-4">
          <div className="metric-label mb-3">Macros</div>
          <div className="grid grid-cols-3 gap-3">
            <MacroRingButton
              label="Protein"
              g={totals.p}
              goal={proteinGoal}
              color={PROTEIN}
              onClick={() => setDrill("protein")}
            />
            <MacroRingButton
              label="Carbs"
              g={totals.c}
              goal={carbGoal}
              color={CARBS}
              onClick={() => setDrill("carbs")}
            />
            <MacroRingButton
              label="Fat"
              g={totals.f}
              goal={fatGoal}
              color={FAT}
              onClick={() => setDrill("fat")}
            />
          </div>
          <div className="mt-3 text-center text-[11px] font-medium text-chalk-500">
            Tap calories or any macro to see the foods behind it
          </div>
        </div>
      </section>

      {drill && (
        <DrillPopup
          metric={drill}
          entries={entries}
          onClose={() => setDrill(null)}
        />
      )}
    </>
  );
}

function MacroRingButton({
  label,
  g,
  goal,
  color,
  onClick,
}: {
  label: string;
  g: number;
  goal: number;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center text-center transition-all duration-200 ease-ios active:scale-[0.97]"
      aria-label={`Break down ${label} by food`}
    >
      <div className="relative">
        <Ring pct={g / Math.max(1, goal)} color={color} size={76} stroke={8} />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-[15px] font-black leading-none" style={{ color }}>
            {g}
            <span className="ml-0.5 text-[10px] font-semibold text-chalk-400">
              g
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2 text-[12px] font-semibold text-white">{label}</div>
      <div className="text-[10px] font-medium text-chalk-400">/ {goal}g</div>
    </button>
  );
}

function DrillPopup({
  metric,
  entries,
  onClose,
}: {
  metric: Metric;
  entries: FoodEntry[];
  onClose: () => void;
}) {
  const meta = METRIC_META[metric];
  useBodyScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const rows = useMemo(
    () =>
      entries
        .map((e) => ({ entry: e, value: Number(e[meta.field]) || 0 }))
        .filter((r) => r.value > 0)
        .sort((a, b) => b.value - a.value),
    [entries, meta.field],
  );

  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${meta.label} by food`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[80svh] w-full flex-col overflow-hidden rounded-t-3xl bg-ink-850 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 p-5 pb-3">
          <div>
            <div className="metric-label" style={{ color: meta.color }}>
              {meta.label} breakdown
            </div>
            <div className="text-[22px] font-black tracking-tight text-white">
              {Math.round(total).toLocaleString()}
              <span className="ml-1 text-[13px] font-semibold text-chalk-400">
                {meta.unit}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-ink-800 text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-ink-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-1">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-[13px] text-chalk-400">
              No foods contribute {meta.label.toLowerCase()} yet.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {rows.map(({ entry, value }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-ink-800 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-white">
                        {entry.name}
                      </div>
                      <div className="text-[11px] font-medium capitalize text-chalk-400">
                        {entry.meal_type}
                        {entry.servings !== 1 ? ` · × ${entry.servings}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className="text-[14px] font-bold"
                        style={{ color: meta.color }}
                      >
                        {Math.round(value).toLocaleString()}
                        <span className="ml-0.5 text-[10px] font-medium text-chalk-400">
                          {meta.unit}
                        </span>
                      </div>
                      <div className="text-[10px] font-medium text-chalk-500">
                        {pct}%
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
