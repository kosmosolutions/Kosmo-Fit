"use client";

import { Flame, Footprints, Bike } from "lucide-react";
import { closeTheGap } from "@/lib/calc";

export function GapMeter({
  eaten,
  burned,
  target,
  weight,
}: {
  eaten: number;
  burned: number;
  target: number;
  weight: number;
}) {
  const res = closeTheGap(eaten, target, burned, weight);
  if (res.status === "on-track") {
    return null;
  }
  return (
    <section className="rounded-2xl border border-accent-rose/25 bg-accent-rose/[0.08] p-5">
      <div className="flex items-center gap-2 text-accent-rose">
        <Flame className="h-4 w-4" />
        <div className="metric-label text-accent-rose">Close the gap</div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-[36px] font-black leading-none tracking-tightest text-white">
          +{res.gap.toLocaleString()}
        </span>
        <span className="text-[13px] font-medium text-chalk-400">cal over</span>
      </div>
      <p className="mt-2 text-[13px] font-medium text-chalk-300">
        Add activity to bring today back to target:
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <GapTile Icon={Footprints} label="Walk" value={res.walkMinutes} unit="min" />
        <GapTile
          Icon={Footprints}
          label="Steps"
          value={res.steps}
          unit=""
          large
        />
        <GapTile Icon={Bike} label="Cardio" value={res.cardioMinutes} unit="min" />
      </div>
    </section>
  );
}

function GapTile({
  Icon,
  label,
  value,
  unit,
  large,
}: {
  Icon: typeof Footprints;
  label: string;
  value: number;
  unit: string;
  large?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-ink-850 p-3">
      <div className="flex items-center gap-1 text-chalk-300">
        <Icon className="h-3.5 w-3.5" />
        <div className="metric-label">{label}</div>
      </div>
      <div className="mt-1 font-display text-[22px] font-black leading-none tracking-tightest text-white">
        {large ? value.toLocaleString() : value}
        {unit && (
          <span className="ml-0.5 text-[11px] font-semibold text-chalk-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
