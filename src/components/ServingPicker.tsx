"use client";

import { useEffect, useRef } from "react";
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

const WHOLES = Array.from({ length: 101 }, (_, i) => i); // 0..100
const ITEM = 44; // row height (px)
const VISIBLE = 5; // odd → one centered row
const PAD = ((VISIBLE - 1) / 2) * ITEM;

const eq = (a: number, b: number) => Math.abs(a - b) < 1e-6;

function pretty(v: number): string {
  return String(Math.round(v * 1000) / 1000);
}

function splitValue(v: number): { whole: number; fracIdx: number } {
  const whole = Math.floor(v + 1e-9);
  const frac = v - whole;
  let bestIdx = 0;
  let bestDist = Infinity;
  FRACTIONS.forEach((f, i) => {
    const d = Math.abs(f.val - frac);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  });
  return { whole, fracIdx: bestIdx };
}

/** iOS-style scroll wheel. Scroll-snaps; the centered row is the selection. */
function Wheel({
  count,
  index,
  onIndex,
  render,
  color,
}: {
  count: number;
  index: number;
  onIndex: (i: number) => void;
  render: (i: number) => string;
  color: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Position the wheel on the current value once on mount.
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = index * ITEM;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onScroll() {
    if (!ref.current) return;
    const i = Math.max(0, Math.min(count - 1, Math.round(ref.current.scrollTop / ITEM)));
    if (i !== index) onIndex(i);
    // Snap precisely to the row after scrolling stops.
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (ref.current) ref.current.scrollTo({ top: i * ITEM, behavior: "smooth" });
    }, 90);
  }

  return (
    <div className="relative flex-1" style={{ height: VISIBLE * ITEM }}>
      {/* center selection band */}
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 -translate-y-1/2 rounded-xl bg-white/[0.06]"
        style={{ height: ITEM }}
      />
      <div
        ref={ref}
        onScroll={onScroll}
        className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto"
      >
        <div style={{ height: PAD }} />
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="flex snap-center items-center justify-center"
            style={{ height: ITEM }}
          >
            <span
              className={cn(
                "text-[19px] font-bold tabular-nums transition-colors",
                i === index ? "" : "text-chalk-500",
              )}
              style={i === index ? { color } : undefined}
            >
              {render(i)}
            </span>
          </div>
        ))}
        <div style={{ height: PAD }} />
      </div>
    </div>
  );
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
  const { whole, fracIdx } = splitValue(value);

  return (
    <div className="rounded-2xl bg-ink-800 p-3.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="label-tiny">{label}</span>
        <span className="text-[12px] font-semibold text-white">
          {pretty(value)}
          {unitHint ? ` × ${unitHint}` : ""}
        </span>
      </div>
      <div className="flex gap-2">
        <Wheel
          count={WHOLES.length}
          index={whole}
          onIndex={(w) => onChange(w + FRACTIONS[fracIdx].val)}
          render={(i) => String(WHOLES[i])}
          color={color}
        />
        <Wheel
          count={FRACTIONS.length}
          index={fracIdx}
          onIndex={(i) => onChange(whole + FRACTIONS[i].val)}
          render={(i) => FRACTIONS[i].label}
          color={color}
        />
      </div>
    </div>
  );
}
