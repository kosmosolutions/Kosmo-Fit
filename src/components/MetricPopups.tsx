"use client";

import { useEffect, useState, useTransition } from "react";
import {
  X,
  Loader2,
  Scale,
  Droplets,
  Footprints,
  Moon,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { upsertDailyEntry } from "@/lib/actions/entries";
import { cn } from "@/lib/cn";
import { useUnitPref } from "@/lib/useUnitPref";
import {
  kgToLb,
  lbToKg,
  mlToOz,
  ozToMl,
  type WaterUnit,
  type WeightUnit,
} from "@/lib/units";

interface BaseProps {
  open: boolean;
  onClose: () => void;
  entryDate: string;
}

// ─── Shared popup shell ───────────────────────────────────────────────────

interface ShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  Icon: LucideIcon;
  tone: { ring: string; chip: string; accent: string };
  pending: boolean;
  error: string | null;
  canSave: boolean;
  onSave: () => void;
  saveLabel?: string;
  children: React.ReactNode;
}

function Shell({
  open,
  onClose,
  title,
  subtitle,
  Icon,
  tone,
  pending,
  error,
  canSave,
  onSave,
  saveLabel = "Save",
  children,
}: ShellProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden rounded-t-3xl bg-ink-850 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <div className={cn("grid h-11 w-11 place-items-center rounded-full", tone.ring)}>
              <Icon className={cn("h-5 w-5", tone.accent)} />
            </div>
            <div>
              <div className="metric-label">{title}</div>
              {subtitle && (
                <h2 className="text-[20px] font-bold tracking-tight text-white">
                  {subtitle}
                </h2>
              )}
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

        <div className="space-y-4 p-5">
          {children}

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
              onClick={onSave}
              disabled={pending || !canSave}
              className={cn(
                "btn flex-1 text-black disabled:opacity-50",
                tone.chip,
              )}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Saving…" : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Unit toggle pill ─────────────────────────────────────────────────────

interface UnitToggleProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}

function UnitToggle<T extends string>({
  value,
  options,
  onChange,
}: UnitToggleProps<T>) {
  return (
    <div className="inline-flex rounded-full bg-ink-800 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-[32px] rounded-full px-3 text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 ease-ios",
            value === o.value
              ? "bg-ink-700 text-white"
              : "text-chalk-400 hover:text-white",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Shared number input + steppers ───────────────────────────────────────

interface NumberFieldProps {
  value: number;
  onChange: (n: number) => void;
  unit: string;
  steps: number[];
  color?: string;
  decimals?: number;
}

function NumberField({
  value,
  onChange,
  unit,
  steps,
  color = "text-chalk-50",
  decimals = 0,
}: NumberFieldProps) {
  return (
    <div className="rounded-2xl bg-ink-800 p-5">
      <div className="flex items-end gap-3">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={decimals > 0 ? 0.1 : 1}
          value={value || ""}
          onChange={(e) =>
            onChange(
              decimals > 0
                ? parseFloat(e.target.value || "0") || 0
                : parseInt(e.target.value || "0", 10) || 0,
            )
          }
          className={cn(
            "w-full min-w-0 bg-transparent font-display text-[44px] font-black leading-none tracking-tightest tabular-nums outline-none placeholder:text-chalk-500",
            color,
          )}
          placeholder="0"
        />
        <div className="pb-1 text-[15px] font-semibold text-chalk-400">{unit}</div>
      </div>
      <div className="mt-4 flex gap-2">
        {steps.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(Math.max(0, value + s))}
            className="min-h-[40px] flex-1 rounded-full bg-ink-700 px-3 text-[13px] font-semibold text-white transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-600"
          >
            {s > 0 ? `+${s}` : s}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Weight ───────────────────────────────────────────────────────────────

interface WeightProps extends BaseProps {
  initialLbs: number | null;
}

export function WeightLogPopup({
  open,
  onClose,
  entryDate,
  initialLbs,
}: WeightProps) {
  const [unit, setUnit] = useUnitPref<WeightUnit>("weight", "lb");
  const [value, setValue] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const v = initialLbs ?? 0;
    setValue(unit === "kg" ? +lbToKg(v).toFixed(1) : +v.toFixed(1));
    setError(null);
    // Intentionally don't react to `unit` here — flipping unit while
    // open is handled by `flipUnit` so we preserve user-typed precision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialLbs]);

  function flipUnit(next: WeightUnit) {
    if (next === unit) return;
    setValue((v) => {
      if (next === "kg") return +lbToKg(v).toFixed(1);
      return +kgToLb(v).toFixed(1);
    });
    setUnit(next);
  }

  function save() {
    setError(null);
    start(async () => {
      try {
        const lbs = unit === "kg" ? kgToLb(value) : value;
        await upsertDailyEntry({
          entry_date: entryDate,
          weight: value > 0 ? +lbs.toFixed(2) : null,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <Shell
      open={open}
      onClose={onClose}
      title="Log weight"
      subtitle="Today's body weight"
      Icon={Scale}
      tone={{
        ring: "bg-accent-blue/20",
        chip: "bg-accent-blue text-white hover:brightness-110",
        accent: "text-accent-blue",
      }}
      pending={pending}
      error={error}
      canSave={true}
      onSave={save}
    >
      <div className="flex justify-end">
        <UnitToggle
          value={unit}
          options={[
            { value: "lb", label: "lb" },
            { value: "kg", label: "kg" },
          ]}
          onChange={flipUnit}
        />
      </div>
      <NumberField
        value={value}
        onChange={setValue}
        unit={unit}
        steps={[-1, 0.5, 1]}
        color="text-accent-blue"
        decimals={1}
      />
    </Shell>
  );
}

// ─── Water ────────────────────────────────────────────────────────────────

interface WaterProps extends BaseProps {
  initialOz: number;
}

export function WaterLogPopup({
  open,
  onClose,
  entryDate,
  initialOz,
}: WaterProps) {
  const [unit, setUnit] = useUnitPref<WaterUnit>("water", "oz");
  const [value, setValue] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(unit === "ml" ? Math.round(ozToMl(initialOz)) : initialOz);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialOz]);

  function flipUnit(next: WaterUnit) {
    if (next === unit) return;
    setValue((v) => (next === "ml" ? Math.round(ozToMl(v)) : Math.round(mlToOz(v))));
    setUnit(next);
  }

  function save() {
    setError(null);
    start(async () => {
      try {
        const oz = unit === "ml" ? Math.round(mlToOz(value)) : value;
        await upsertDailyEntry({
          entry_date: entryDate,
          water_oz: Math.max(0, oz),
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  const steps = unit === "ml" ? [120, 240, 500] : [4, 8, 16];

  return (
    <Shell
      open={open}
      onClose={onClose}
      title="Log water"
      subtitle="Today's hydration"
      Icon={Droplets}
      tone={{
        ring: "bg-accent-cyan/20",
        chip: "bg-accent-cyan text-black hover:brightness-110",
        accent: "text-accent-cyan",
      }}
      pending={pending}
      error={error}
      canSave={true}
      onSave={save}
    >
      <div className="flex justify-end">
        <UnitToggle
          value={unit}
          options={[
            { value: "oz", label: "oz" },
            { value: "ml", label: "ml" },
          ]}
          onChange={flipUnit}
        />
      </div>
      <NumberField
        value={value}
        onChange={setValue}
        unit={unit}
        steps={steps}
        color="text-accent-cyan"
      />
    </Shell>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────

interface StepsProps extends BaseProps {
  initialSteps: number;
}

export function StepsLogPopup({
  open,
  onClose,
  entryDate,
  initialSteps,
}: StepsProps) {
  const [value, setValue] = useState(initialSteps);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialSteps);
    setError(null);
  }, [open, initialSteps]);

  function save() {
    setError(null);
    start(async () => {
      try {
        await upsertDailyEntry({
          entry_date: entryDate,
          steps: Math.max(0, value),
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <Shell
      open={open}
      onClose={onClose}
      title="Log steps"
      subtitle="Today's step count"
      Icon={Footprints}
      tone={{
        ring: "bg-accent-blue/20",
        chip: "bg-accent-blue text-white hover:brightness-110",
        accent: "text-accent-blue",
      }}
      pending={pending}
      error={error}
      canSave={true}
      onSave={save}
    >
      <NumberField
        value={value}
        onChange={setValue}
        unit="steps"
        steps={[500, 1000, 5000]}
        color="text-accent-blue"
      />
    </Shell>
  );
}

// ─── Sleep ────────────────────────────────────────────────────────────────

interface SleepProps extends BaseProps {
  initialHours: number | null;
}

export function SleepLogPopup({
  open,
  onClose,
  entryDate,
  initialHours,
}: SleepProps) {
  const [value, setValue] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialHours ?? 0);
    setError(null);
  }, [open, initialHours]);

  function save() {
    setError(null);
    start(async () => {
      try {
        await upsertDailyEntry({
          entry_date: entryDate,
          sleep_hours: value > 0 ? +value.toFixed(1) : null,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <Shell
      open={open}
      onClose={onClose}
      title="Log sleep"
      subtitle="Last night's sleep"
      Icon={Moon}
      tone={{
        ring: "bg-accent-violet/20",
        chip: "bg-accent-violet text-white hover:brightness-110",
        accent: "text-accent-violet",
      }}
      pending={pending}
      error={error}
      canSave={true}
      onSave={save}
    >
      <NumberField
        value={value}
        onChange={setValue}
        unit="hrs"
        steps={[-0.5, 0.5, 1]}
        color="text-accent-violet"
        decimals={1}
      />
    </Shell>
  );
}

// ─── Notes ────────────────────────────────────────────────────────────────

interface NotesProps extends BaseProps {
  initialNotes: string | null;
}

export function NotesLogPopup({
  open,
  onClose,
  entryDate,
  initialNotes,
}: NotesProps) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setValue(initialNotes ?? "");
    setError(null);
  }, [open, initialNotes]);

  function save() {
    setError(null);
    start(async () => {
      try {
        await upsertDailyEntry({
          entry_date: entryDate,
          notes: value.trim() ? value.trim() : null,
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <Shell
      open={open}
      onClose={onClose}
      title="Notes"
      subtitle="How was today?"
      Icon={StickyNote}
      tone={{
        ring: "bg-accent-amber/20",
        chip: "bg-accent-amber hover:brightness-110",
        accent: "text-accent-amber",
      }}
      pending={pending}
      error={error}
      canSave={true}
      onSave={save}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Anything notable about today — training quality, sleep, energy, cravings…"
        rows={5}
        className="field min-h-[120px] w-full resize-none"
      />
    </Shell>
  );
}
