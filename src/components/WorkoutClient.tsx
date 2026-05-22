"use client";

import { useState } from "react";
import { House, Building, Sparkles } from "lucide-react";
import { ExerciseCard } from "./ExerciseCard";
import { WellnessSection } from "./WellnessSection";
import { SessionTimer } from "./SessionTimer";
import { GYM_DAYS, HOME_DAYS, type WorkoutDay } from "@/data/workouts";
import { cn } from "@/lib/cn";
import type { WorkoutMode } from "@/lib/types";

interface Props {
  initialMode: WorkoutMode;
  initialDay: number;
  todayTarget: number;
  todayBurn: number;
  dailyDeficit: number;
  lifeTDEE: number;
  weekTargets: number[];
}

export function WorkoutClient({
  initialMode,
  initialDay,
  todayTarget,
  todayBurn,
  dailyDeficit,
  lifeTDEE,
  weekTargets,
}: Props) {
  const [view, setView] = useState<"training" | "wellness">("training");
  const [mode, setMode] = useState<WorkoutMode>(initialMode);
  const [wDay, setWDay] = useState(Math.max(0, initialDay));
  const [expanded, setExpanded] = useState(false);
  const days = mode === "gym" ? GYM_DAYS : HOME_DAYS;
  const d: WorkoutDay = days[wDay];
  const todayDayTarget = weekTargets[wDay] ?? todayTarget;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-tiny">6-day split</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
            Workout plan
          </h1>
        </div>
        <div className="flex gap-1">
          <div className="flex rounded-xl bg-white/[0.06] p-0.5">
            {(
              [
                { k: "home", Icon: House, label: "Home" },
                { k: "gym", Icon: Building, label: "Gym" },
              ] as const
            ).map(({ k, Icon, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => { setMode(k); setView("training"); }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  view === "training" && mode === k
                    ? "bg-white/[0.12] text-chalk-50"
                    : "text-chalk-400",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setView(view === "wellness" ? "training" : "wellness")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
              view === "wellness"
                ? "bg-accent-violet/20 text-accent-violet ring-1 ring-accent-violet/40"
                : "bg-white/[0.06] text-chalk-400 hover:text-chalk-200",
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Wellness
          </button>
        </div>
      </div>

      {view === "wellness" && <WellnessSection />}

      {view === "training" && <>
      {/* Day picker */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {days.map((dd, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setWDay(i);
              setExpanded(false);
            }}
            className={cn(
              "shrink-0 rounded-xl border-2 px-3 py-2 text-center transition",
              wDay === i
                ? "text-ink-950"
                : "border-white/[0.07] bg-white/[0.04] text-chalk-300",
            )}
            style={
              wDay === i
                ? { background: dd.color, borderColor: dd.color }
                : undefined
            }
          >
            <div className="text-base leading-none">{dd.icon}</div>
            <div className="mt-1 text-[10px] font-extrabold">{dd.day}</div>
            <div className="text-[9px] opacity-80">{dd.weekday}</div>
          </button>
        ))}
      </div>

      {/* Calorie banner */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="block w-full text-left"
      >
        <div
          className="rounded-2xl border p-4"
          style={{
            background: `linear-gradient(135deg, ${d.color}1f, ${d.color}07)`,
            borderColor: `${d.color}55`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <div
                  className="text-[10px] uppercase tracking-[2px]"
                  style={{ color: d.color }}
                >
                  Eat today · {d.focus}
                </div>
                <div
                  className="text-3xl font-black leading-none"
                  style={{ color: d.color }}
                >
                  {todayDayTarget.toLocaleString()}
                </div>
                <div className="text-[11px] text-chalk-400">cal target</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-chalk-400">🔥 Burn</div>
              <div className="text-base font-extrabold text-accent-amber">
                ~{todayBurn}
              </div>
              <div className="mt-1 text-[10px] text-chalk-400">Deficit</div>
              <div className="text-sm font-bold text-accent-green">
                {dailyDeficit} cal
              </div>
            </div>
          </div>
          {expanded ? (
            <div
              className="mt-3 border-t pt-3 text-[11px]"
              style={{ borderColor: `${d.color}25` }}
            >
              <div className="flex flex-wrap gap-2">
                <span className="text-chalk-50">
                  Life TDEE: {lifeTDEE.toLocaleString()}
                </span>
                <span className="text-accent-green">+ burn: {todayBurn}</span>
                <span className="text-accent-rose">
                  − deficit: {dailyDeficit}
                </span>
                <span className="font-bold" style={{ color: d.color }}>
                  = eat: {todayDayTarget.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-chalk-300">{d.calNote}</div>
              {d.epoc ? (
                <div className="mt-1 text-accent-amber">
                  ⚡ EPOC: this session keeps burning 10–15% extra for hours
                  after.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </button>

      {/* Session timer */}
      <SessionTimer color={d.color} />

      {/* Day card with exercises */}
      <div
        className="rounded-2xl border"
        style={{
          background: `${d.color}10`,
          borderColor: `${d.color}33`,
        }}
      >
        <div
          className="flex items-center gap-3 rounded-t-2xl px-4 py-3"
          style={{
            background: `${d.color}1f`,
            borderBottom: `1px solid ${d.color}22`,
          }}
        >
          <div
            className="grid h-10 w-10 place-items-center rounded-xl border-2 text-lg"
            style={{
              background: `${d.color}28`,
              borderColor: d.color,
            }}
          >
            {d.icon}
          </div>
          <div>
            <div
              className="text-[10px] uppercase tracking-[3px]"
              style={{ color: d.color }}
            >
              {d.day} · {d.weekday}
            </div>
            <div className="text-base font-extrabold text-chalk-50">
              {d.focus}
            </div>
            <div className="text-[10px] text-chalk-500">
              {mode === "gym" ? "Gym" : "Home"} · {d.duration}
            </div>
          </div>
        </div>
        <div className="rounded-b-2xl bg-ink-850 px-4 py-2">
          {d.exercises.map((ex, i) => (
            <ExerciseCard
              key={`${ex.name}-${i}`}
              index={i}
              exercise={ex}
              color={d.color}
            />
          ))}
        </div>
      </div>

      {d.cardio ? (
        <div className="rounded-2xl border border-accent-amber/20 bg-accent-amber/[0.06] p-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🚴</span>
            <div>
              <div className="text-[10px] uppercase tracking-[2px] text-accent-amber">
                Post-workout cardio
              </div>
              <div className="text-xs text-chalk-300">{d.cardio}</div>
            </div>
          </div>
        </div>
      ) : null}
      </>}
    </div>
  );
}
