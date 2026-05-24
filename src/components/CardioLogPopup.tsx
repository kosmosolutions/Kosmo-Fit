"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { X, Bike, Timer, Flame, Loader2 } from "lucide-react";
import { upsertDailyEntry } from "@/lib/actions/entries";
import { walkingCalPerMin } from "@/lib/calc";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  onClose: () => void;
  entryDate: string;
  bodyWeightLbs: number;
  initialMinutes: number;
  initialCalories: number;
}

type InputMode = "minutes" | "calories";

/**
 * Convert between cardio minutes and calories using the body weight + a
 * moderate-cardio multiplier. Matches the heuristic in calc.ts where
 * cardio is approximated as walking calorie burn × 2.2.
 */
function calPerMinModerate(weightLbs: number): number {
  return Math.max(walkingCalPerMin(weightLbs) * 2.2, 1);
}

export function CardioLogPopup({
  open,
  onClose,
  entryDate,
  bodyWeightLbs,
  initialMinutes,
  initialCalories,
}: Props) {
  const [mode, setMode] = useState<InputMode>("minutes");
  const [minutes, setMinutes] = useState(initialMinutes);
  const [calories, setCalories] = useState(initialCalories);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const calPerMin = useMemo(
    () => calPerMinModerate(bodyWeightLbs),
    [bodyWeightLbs],
  );

  useEffect(() => {
    if (!open) return;
    setMode(initialMinutes > 0 || initialCalories === 0 ? "minutes" : "calories");
    setMinutes(initialMinutes);
    setCalories(initialCalories);
    setError(null);
  }, [open, initialMinutes, initialCalories]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function setFromMinutes(m: number) {
    setMinutes(m);
    setCalories(Math.round(m * calPerMin));
  }

  function setFromCalories(c: number) {
    setCalories(c);
    setMinutes(c > 0 ? Math.round(c / calPerMin) : 0);
  }

  function save() {
    setError(null);
    start(async () => {
      try {
        await upsertDailyEntry({
          entry_date: entryDate,
          cardio_minutes: minutes,
          cardio_calories: calories,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save cardio");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Log cardio"
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-ink-900 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent-amber/15 ring-1 ring-accent-amber/30">
              <Bike className="h-5 w-5 text-accent-amber" />
            </div>
            <div>
              <div className="label-tiny">Log cardio</div>
              <h2 className="text-lg font-extrabold text-chalk-50">
                Today&apos;s session
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-chalk-300 transition hover:bg-white/[0.08] hover:text-chalk-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="p-5">
          <div className="flex rounded-xl bg-white/[0.06] p-0.5">
            {(
              [
                { k: "minutes" as const, Icon: Timer, label: "By minutes" },
                { k: "calories" as const, Icon: Flame, label: "By calories" },
              ]
            ).map(({ k, Icon, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => setMode(k)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition",
                  mode === k
                    ? "bg-white/[0.12] text-chalk-50"
                    : "text-chalk-400 hover:text-chalk-200",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Active input */}
          <div className="mt-5">
            {mode === "minutes" ? (
              <NumberInput
                label="Minutes"
                unit="min"
                value={minutes}
                onChange={setFromMinutes}
                step={5}
                color="text-accent-amber"
              />
            ) : (
              <NumberInput
                label="Calories burned"
                unit="cal"
                value={calories}
                onChange={setFromCalories}
                step={10}
                color="text-accent-amber"
              />
            )}
          </div>

          {/* Derived value */}
          <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="text-[10px] font-bold uppercase tracking-[2px] text-chalk-500">
              Auto-derived
            </div>
            <div className="mt-0.5 text-sm font-bold text-chalk-200">
              {mode === "minutes"
                ? `≈ ${calories.toLocaleString()} cal`
                : `≈ ${minutes} min`}
              <span className="ml-2 text-[11px] font-medium text-chalk-500">
                at {Math.round(calPerMin)} cal/min ({Math.round(bodyWeightLbs)} lbs)
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-bold text-chalk-200 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || (minutes === 0 && calories === 0)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-accent-amber px-4 py-2.5 text-sm font-extrabold text-ink-950 transition hover:bg-accent-amber/90 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Saving…" : "Save cardio"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
  step?: number;
  color?: string;
}

function NumberInput({
  label,
  unit,
  value,
  onChange,
  step = 1,
  color = "text-chalk-50",
}: NumberInputProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="text-[10px] font-bold uppercase tracking-[2px] text-chalk-500">
        {label}
      </div>
      <div className="mt-1 flex items-end gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={step}
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value || "0", 10) || 0)}
          className={cn(
            "w-full min-w-0 bg-transparent text-4xl font-black tabular-nums outline-none placeholder:text-chalk-600",
            color,
          )}
          placeholder="0"
        />
        <div className="pb-2 text-sm font-bold text-chalk-400">{unit}</div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {[step, step * 3, step * 6].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(value + s)}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs font-bold text-chalk-200 transition hover:bg-white/[0.08]"
          >
            +{s}
          </button>
        ))}
      </div>
    </div>
  );
}
