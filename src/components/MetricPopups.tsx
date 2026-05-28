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
        className="w-full overflow-hidden rounded-t-3xl border border-white/10 bg-ink-900 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 p-5">
          <div className="flex items-center gap-3">
            <div className={cn("grid h-10 w-10 place-items-center rounded-xl", tone.ring)}>
              <Icon className={cn("h-5 w-5", tone.accent)} />
            </div>
            <div>
              <div className="label-tiny">{title}</div>
              {subtitle && (
                <h2 className="text-lg font-extrabold text-chalk-50">{subtitle}</h2>
              )}
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

        <div className="space-y-4 p-5">
          {children}

          {error && (
            <div className="rounded-xl border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
              {error}
            </div>
          )}

          <div className="flex gap-2">
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
              onClick={onSave}
              disabled={pending || !canSave}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-extrabold text-ink-950 transition disabled:opacity-50",
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
    <div className="inline-flex rounded-lg bg-white/[0.06] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition",
            value === o.value
              ? "bg-white/[0.14] text-chalk-50"
              : "text-chalk-400 hover:text-chalk-200",
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
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
            "w-full min-w-0 bg-transparent text-4xl font-black tabular-nums outline-none placeholder:text-chalk-600",
            color,
          )}
          placeholder="0"
        />
        <div className="pb-2 text-sm font-bold text-chalk-400">{unit}</div>
      </div>
      <div className="mt-3 flex gap-1.5">
        {steps.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(Math.max(0, value + s))}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs font-bold text-chalk-200 transition hover:bg-white/[0.08]"
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
        ring: "bg-accent-cyan/15 ring-1 ring-accent-cyan/30",
        chip: "bg-accent-cyan hover:bg-accent-cyan/90",
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
        color="text-accent-cyan"
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
        ring: "bg-sky-400/15 ring-1 ring-sky-400/30",
        chip: "bg-sky-400 hover:bg-sky-400/90",
        accent: "text-sky-300",
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
        color="text-sky-300"
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
        ring: "bg-accent-cyan/15 ring-1 ring-accent-cyan/30",
        chip: "bg-accent-cyan hover:bg-accent-cyan/90",
        accent: "text-accent-cyan",
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
        color="text-accent-cyan"
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
        ring: "bg-accent-violet/15 ring-1 ring-accent-violet/30",
        chip: "bg-accent-violet hover:bg-accent-violet/90",
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
        ring: "bg-accent-amber/15 ring-1 ring-accent-amber/30",
        chip: "bg-accent-amber hover:bg-accent-amber/90",
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
