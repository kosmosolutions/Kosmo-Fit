"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

// Common cooking fractions. `0` = whole number only.
const FRACTIONS = [
  { label: "—", val: 0 },
  { label: "⅛", val: 0.125 },
  { label: "¼", val: 0.25 },
  { label: "⅓", val: 1 / 3 },
  { label: "½", val: 0.5 },
  { label: "⅔", val: 2 / 3 },
  { label: "¾", val: 0.75 },
];

const WHOLES = Array.from({ length: 21 }, (_, i) => i); // 0..20

function splitValue(v: number): { whole: number; fracVal: number } {
  const whole = Math.floor(v + 1e-9);
  const frac = v - whole;
  let best = FRACTIONS[0];
  let bestDist = Infinity;
  for (const f of FRACTIONS) {
    const d = Math.abs(f.val - frac);
    if (d < bestDist) {
      bestDist = d;
      best = f;
    }
  }
  return { whole, fracVal: best.val };
}

const eq = (a: number, b: number) => Math.abs(a - b) < 1e-6;

/** Tidy display: drop trailing zeros (1.5, 0.33). */
function pretty(v: number): string {
  return String(Math.round(v * 1000) / 1000);
}

export function ServingPicker({
  label,
  value,
  onChange,
  color = "#0A84FF",
  unitHint,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  color?: string;
  unitHint?: string;
}) {
  // Default to the fraction wheel when the value is a clean fraction, else decimal.
  const { whole, fracVal } = splitValue(value);
  const isCleanFraction = eq(whole + fracVal, value);
  const [mode, setMode] = useState<"dec" | "frac">(
    isCleanFraction ? "frac" : "dec",
  );

  return (
    <div className="rounded-2xl bg-ink-800 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <div>
          <span className="label-tiny">{label}</span>
          {unitHint && (
            <span className="ml-1.5 text-[11px] font-medium text-chalk-400">
              × {unitHint}
            </span>
          )}
        </div>
        <div className="flex rounded-full bg-ink-900 p-0.5">
          {(["dec", "frac"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition",
                mode === m ? "bg-ink-700 text-white" : "text-chalk-400",
              )}
            >
              {m === "dec" ? "Dec" : "Frac"}
            </button>
          ))}
        </div>
      </div>

      {mode === "dec" ? (
        <input
          type="number"
          inputMode="decimal"
          step={0.1}
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full bg-transparent font-display text-[28px] font-black leading-none tracking-tightest text-white outline-none"
        />
      ) : (
        <div className="space-y-2">
          {/* Whole-number wheel — horizontal scroll */}
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {WHOLES.map((w) => {
              const sel = w === whole;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChange(w + fracVal)}
                  className={cn(
                    "min-w-[42px] shrink-0 rounded-lg py-2 text-[15px] font-bold transition",
                    sel ? "text-black" : "bg-ink-900 text-chalk-300 hover:bg-ink-700",
                  )}
                  style={sel ? { background: color } : undefined}
                >
                  {w}
                </button>
              );
            })}
          </div>
          {/* Fraction row */}
          <div className="flex gap-1.5">
            {FRACTIONS.map((f) => {
              const sel = eq(f.val, fracVal);
              return (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => onChange(whole + f.val)}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-[15px] font-bold transition",
                    sel ? "text-black" : "bg-ink-900 text-chalk-300 hover:bg-ink-700",
                  )}
                  style={sel ? { background: color } : undefined}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="text-center text-[12px] font-medium text-chalk-400">
            = {pretty(value)}
            {unitHint ? ` × ${unitHint}` : " servings"}
          </div>
        </div>
      )}
    </div>
  );
}
