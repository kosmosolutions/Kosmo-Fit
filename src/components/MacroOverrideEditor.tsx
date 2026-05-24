"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { updateMacroOverride } from "@/lib/actions/profile";
import { cn } from "@/lib/cn";

interface Props {
  initialProtein: number | null;
  initialCarb: number | null;
  initialFat: number | null;
  /** Approx daily target — used to render macro grams as a live preview. */
  previewCalories: number;
  /** Default protein in grams when override is off (0.9 g/lb fallback). */
  defaultProteinG: number;
}

interface Preset {
  id: string;
  label: string;
  protein: number;
  carb: number;
  fat: number;
}

const PRESETS: Preset[] = [
  { id: "balanced", label: "Balanced", protein: 30, carb: 40, fat: 30 },
  { id: "high-protein", label: "High protein", protein: 40, carb: 35, fat: 25 },
  { id: "low-carb", label: "Low carb", protein: 35, carb: 20, fat: 45 },
  { id: "keto", label: "Keto", protein: 25, carb: 5, fat: 70 },
];

type Macros = { protein: number; carb: number; fat: number };

export function MacroOverrideEditor({
  initialProtein,
  initialCarb,
  initialFat,
  previewCalories,
  defaultProteinG,
}: Props) {
  const hasOverride =
    initialProtein !== null && initialCarb !== null && initialFat !== null;

  const [enabled, setEnabled] = useState(hasOverride);
  const [macros, setMacros] = useState<Macros>({
    protein: initialProtein ?? 30,
    carb: initialCarb ?? 40,
    fat: initialFat ?? 30,
  });
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const total = macros.protein + macros.carb + macros.fat;
  const valid = total === 100 && macros.fat >= 10 && macros.fat <= 70;

  // Compare against last-saved state so we know if the user has unsaved edits.
  const dirty = useMemo(() => {
    if (enabled !== hasOverride) return true;
    if (!enabled) return false;
    return (
      macros.protein !== initialProtein ||
      macros.carb !== initialCarb ||
      macros.fat !== initialFat
    );
  }, [enabled, hasOverride, macros, initialProtein, initialCarb, initialFat]);

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 1500);
      return () => clearTimeout(t);
    }
  }, [saved]);

  function applyPreset(p: Preset) {
    setMacros({ protein: p.protein, carb: p.carb, fat: p.fat });
    setEnabled(true);
    setError(null);
  }

  function clampPair(field: keyof Macros, raw: number) {
    const v = Math.max(0, Math.min(100, Math.round(raw)));
    setMacros((m) => ({ ...m, [field]: v }));
    setError(null);
  }

  function save() {
    setError(null);
    start(async () => {
      try {
        await updateMacroOverride(
          enabled
            ? {
                macro_protein_pct: macros.protein,
                macro_carb_pct: macros.carb,
                macro_fat_pct: macros.fat,
              }
            : {
                macro_protein_pct: null,
                macro_carb_pct: null,
                macro_fat_pct: null,
              },
        );
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save macros");
      }
    });
  }

  // Live preview gram counts.
  const proteinG = enabled
    ? Math.round((previewCalories * (macros.protein / 100)) / 4)
    : defaultProteinG;
  const carbG = enabled
    ? Math.round((previewCalories * (macros.carb / 100)) / 4)
    : Math.round(
        Math.max(0, previewCalories - defaultProteinG * 4 - previewCalories * 0.27) /
          4,
      );
  const fatG = enabled
    ? Math.round((previewCalories * (macros.fat / 100)) / 9)
    : Math.round((previewCalories * 0.27) / 9);

  return (
    <div className="space-y-3">
      {/* Auto vs. Custom toggle */}
      <div className="flex rounded-xl bg-white/[0.06] p-0.5">
        {(
          [
            { k: false, label: "Auto" },
            { k: true, label: "Custom" },
          ] as const
        ).map(({ k, label }) => (
          <button
            key={String(k)}
            type="button"
            onClick={() => {
              setEnabled(k);
              setError(null);
            }}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-xs font-bold transition",
              enabled === k
                ? "bg-white/[0.12] text-chalk-50"
                : "text-chalk-400 hover:text-chalk-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {!enabled && (
        <div className="text-[11px] text-chalk-400">
          Default: protein ≈ 0.9 g per lb body weight, fat ≈ 27% of calories,
          carbs fill the rest.
        </div>
      )}

      {enabled && (
        <>
          {/* Preset chips */}
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const active =
                macros.protein === p.protein &&
                macros.carb === p.carb &&
                macros.fat === p.fat;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                    active
                      ? "border-accent-cyan/60 bg-accent-cyan/15 text-accent-cyan"
                      : "border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]",
                  )}
                >
                  {p.label}
                  <span className="ml-1.5 font-normal text-chalk-500">
                    {p.protein}/{p.carb}/{p.fat}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Three percent inputs */}
          <div className="grid grid-cols-3 gap-2">
            <PercentInput
              label="Protein"
              tone="text-accent-violet"
              value={macros.protein}
              grams={proteinG}
              onChange={(v) => clampPair("protein", v)}
            />
            <PercentInput
              label="Carbs"
              tone="text-accent-amber"
              value={macros.carb}
              grams={carbG}
              onChange={(v) => clampPair("carb", v)}
            />
            <PercentInput
              label="Fat"
              tone="text-accent-rose"
              value={macros.fat}
              grams={fatG}
              onChange={(v) => clampPair("fat", v)}
            />
          </div>

          {/* Sum indicator */}
          <div
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2 text-[11px] font-bold",
              valid
                ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
                : "border-accent-rose/30 bg-accent-rose/10 text-accent-rose",
            )}
          >
            <span>
              Total: {total}% — {valid ? "looks good" : "must equal 100%"}
            </span>
            <span className="text-chalk-400">
              ≈ {previewCalories.toLocaleString()} cal target
            </span>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-accent-rose/30 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {saved && (
          <span className="text-[11px] font-bold text-accent-green">
            Saved
          </span>
        )}
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty || (enabled && !valid)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent-cyan px-4 py-2 text-sm font-extrabold text-ink-950 transition hover:bg-accent-cyan/90 disabled:opacity-50"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {!pending && saved && <Check className="h-4 w-4" />}
          {pending ? "Saving…" : "Save macros"}
        </button>
      </div>
    </div>
  );
}

interface PercentInputProps {
  label: string;
  tone: string;
  value: number;
  grams: number;
  onChange: (v: number) => void;
}

function PercentInput({
  label,
  tone,
  value,
  grams,
  onChange,
}: PercentInputProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
      <div className={cn("text-[10px] font-bold uppercase tracking-[2px]", tone)}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) =>
            onChange(parseInt(e.target.value || "0", 10) || 0)
          }
          className={cn(
            "w-full min-w-0 bg-transparent text-2xl font-black tabular-nums outline-none",
            tone,
          )}
        />
        <span className="text-xs font-bold text-chalk-400">%</span>
      </div>
      <div className="mt-1 text-[10px] font-medium text-chalk-500">
        ≈ {grams} g
      </div>
    </div>
  );
}
