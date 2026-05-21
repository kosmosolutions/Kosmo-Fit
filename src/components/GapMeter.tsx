"use client";

import { Flame, Footprints, Bike, Check } from "lucide-react";
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
    const left = Math.max(0, target - (eaten - burned));
    return (
      <div className="card-elev p-4">
        <div className="flex items-center gap-2 text-accent-green">
          <Check className="h-4 w-4" />
          <div className="label-tiny text-accent-green">On track</div>
        </div>
        <div className="mt-2 text-2xl font-black text-chalk-50">
          {left.toLocaleString()}{" "}
          <span className="text-sm font-normal text-chalk-400">
            cal headroom
          </span>
        </div>
        <p className="mt-1 text-xs text-chalk-300">
          You can still eat {left.toLocaleString()} cal today and stay on plan.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-accent-amber/30 bg-accent-amber/[0.06] p-4">
      <div className="flex items-center gap-2 text-accent-amber">
        <Flame className="h-4 w-4" />
        <div className="label-tiny text-accent-amber">Close the gap</div>
      </div>
      <div className="mt-2 text-2xl font-black text-chalk-50">
        +{res.gap.toLocaleString()}{" "}
        <span className="text-sm font-normal text-chalk-400">cal over</span>
      </div>
      <p className="mt-1 text-xs text-chalk-300">
        Add activity to bring today back to your target:
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-1 text-chalk-300">
            <Footprints className="h-3.5 w-3.5" />
            <div className="label-tiny">Walk</div>
          </div>
          <div className="mt-1 text-lg font-extrabold text-chalk-50">
            {res.walkMinutes}
            <span className="ml-0.5 text-[10px] text-chalk-400">min</span>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-1 text-chalk-300">
            <Footprints className="h-3.5 w-3.5" />
            <div className="label-tiny">Steps</div>
          </div>
          <div className="mt-1 text-lg font-extrabold text-chalk-50">
            {res.steps.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-1 text-chalk-300">
            <Bike className="h-3.5 w-3.5" />
            <div className="label-tiny">Cardio</div>
          </div>
          <div className="mt-1 text-lg font-extrabold text-chalk-50">
            {res.cardioMinutes}
            <span className="ml-0.5 text-[10px] text-chalk-400">min</span>
          </div>
        </div>
      </div>
    </div>
  );
}
