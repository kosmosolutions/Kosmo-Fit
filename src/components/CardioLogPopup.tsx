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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Log cardio"
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden rounded-t-3xl bg-ink-850 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-accent-rose/20">
              <Bike className="h-5 w-5 text-accent-rose" />
            </div>
            <div>
              <div className="metric-label">Log cardio</div>
              <h2 className="text-[20px] font-bold tracking-tight text-white">
                Today&apos;s session
              </h2>
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

        <div className="p-5 pt-0 space-y-4">
          <div className="flex rounded-full bg-ink-800 p-1">
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
                  "flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-all duration-200 ease-ios",
                  mode === k
                    ? "bg-ink-700 text-white"
                    : "text-chalk-400 hover:text-white",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div>
            {mode === "minutes" ? (
              <NumberInput
                label="Minutes"
                unit="min"
                value={minutes}
                onChange={setFromMinutes}
                step={5}
                color="text-accent-rose"
              />
            ) : (
              <NumberInput
                label="Calories burned"
                unit="cal"
                value={calories}
                onChange={setFromCalories}
                step={10}
                color="text-accent-rose"
              />
            )}
          </div>

          <div className="rounded-2xl bg-ink-800 px-4 py-3">
            <div className="metric-label">Auto-derived</div>
            <div className="mt-0.5 text-[14px] font-semibold text-white">
              {mode === "minutes"
                ? `≈ ${calories.toLocaleString()} cal`
                : `≈ ${minutes} min`}
              <span className="ml-2 text-[12px] font-medium text-chalk-400">
                at {Math.round(calPerMin)} cal/min ({Math.round(bodyWeightLbs)} lb)
              </span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-accent-rose/15 px-4 py-3 text-[13px] font-semibold text-accent-rose">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending || (minutes === 0 && calories === 0)}
              className="btn flex-1 bg-accent-rose text-white hover:brightness-110 disabled:opacity-50"
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
  color = "text-white",
}: NumberInputProps) {
  return (
    <div className="rounded-2xl bg-ink-800 p-5">
      <div className="metric-label">{label}</div>
      <div className="mt-1 flex items-end gap-3">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={step}
          value={value || ""}
          onChange={(e) => onChange(parseInt(e.target.value || "0", 10) || 0)}
          className={cn(
            "w-full min-w-0 bg-transparent font-display text-[44px] font-black leading-none tracking-tightest tabular-nums outline-none placeholder:text-chalk-500",
            color,
          )}
          placeholder="0"
        />
        <div className="pb-1 text-[15px] font-semibold text-chalk-400">{unit}</div>
      </div>
      <div className="mt-4 flex gap-2">
        {[step, step * 3, step * 6].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(value + s)}
            className="min-h-[40px] flex-1 rounded-full bg-ink-700 px-3 text-[13px] font-semibold text-white transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-600"
          >
            +{s}
          </button>
        ))}
      </div>
    </div>
  );
}
