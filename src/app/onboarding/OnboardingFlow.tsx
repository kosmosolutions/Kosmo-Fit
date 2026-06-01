"use client";

import { useState, useTransition } from "react";
import { LogoMark } from "@/components/LogoMark";
import { LIFESTYLE, calcStats } from "@/lib/calc";
import { saveProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["You", "Body", "Goals", "Lifestyle", "Review"] as const;
const TIMEFRAMES = [12, 16, 20, 24, 30, 40, 52];

export function OnboardingFlow({
  fullName,
  existing,
}: {
  fullName: string;
  existing: Profile | null;
}) {
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    full_name: existing?.full_name ?? fullName,
    sex: (existing?.sex ?? "male") as "male" | "female" | "other",
    age: existing?.age ?? 30,
    height_ft: existing?.height_ft ?? 5,
    height_in: existing?.height_in ?? 10,
    current_weight: existing?.current_weight ?? 180,
    goal_weight: existing?.goal_weight ?? 165,
    weeks_to_goal: existing?.weeks_to_goal ?? 20,
    lifestyle: (existing?.lifestyle ?? "desk") as "desk" | "light" | "active",
    workout_mode: (existing?.workout_mode ?? "home") as "home" | "gym" | "both",
    daily_step_goal: existing?.daily_step_goal ?? 8000,
    fitness_experience: (existing?.fitness_experience ?? "beginner") as
      | "beginner"
      | "intermediate"
      | "advanced",
    primary_goal: (existing?.primary_goal ?? "lose_fat") as
      | "lose_fat"
      | "build_muscle"
      | "maintain"
      | "recomp",
    notes: existing?.notes ?? "",
  });

  const stats = calcStats(
    {
      current_weight: form.current_weight,
      goal_weight: form.goal_weight,
      height_ft: form.height_ft,
      height_in: form.height_in,
      age: form.age,
      sex: form.sex,
      lifestyle: form.lifestyle,
      weeks_to_goal: form.weeks_to_goal,
    },
    form.workout_mode === "gym" ? "gym" : "home",
  );

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    start(async () => {
      await saveProfile(form, /*finishOnboarding*/ true);
    });
  };

  const can = step === STEPS.length - 1;

  return (
    <div className="mx-auto max-w-md px-5 pb-8 pt-safe-8">
      <LogoMark />

      {/* Step indicator */}
      <div className="mt-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= step ? "bg-accent-blue" : "bg-white/10",
            )}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[2px] text-chalk-400">
        <span>
          Step {step + 1} of {STEPS.length}
        </span>
        <span className="text-chalk-200">{STEPS[step]}</span>
      </div>

      <div className="mt-6">
        {step === 0 && (
          <div className="space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome to Kosmo Fitness.
            </h1>
            <p className="text-sm text-chalk-300">
              We&apos;ll build your daily plan in under two minutes. Everything
              you enter stays private to your account.
            </p>
            <label className="block">
              <span className="metric-label">Your name</span>
              <input
                value={form.full_name ?? ""}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                className="field mt-2"
                placeholder="What should we call you?"
              />
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["male", "female", "other"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, sex: s })}
                  className={cn(
                    "btn-secondary capitalize",
                    form.sex === s &&
                      "border-accent-blue/60 bg-accent-blue/10 text-accent-blue",
                  )}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight">Your body</h1>
            <p className="text-sm text-chalk-300">
              We use these to calculate your BMR, TDEE and macro targets.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <NumberCard label="Age" unit="yrs" value={form.age} min={13} max={100} onChange={(v) => setForm({ ...form, age: v })} />
              <NumberCard label="Height (ft)" unit="ft" value={form.height_ft} min={4} max={7} onChange={(v) => setForm({ ...form, height_ft: v })} />
              <NumberCard label="Height (in)" unit="in" value={form.height_in} min={0} max={11} onChange={(v) => setForm({ ...form, height_in: v })} />
            </div>
            <NumberCard label="Current weight" unit="lbs" value={form.current_weight} min={80} max={500} onChange={(v) => setForm({ ...form, current_weight: v })} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight">Your goal</h1>
            <p className="text-sm text-chalk-300">
              Pick a primary focus, a target weight and a timeframe. We&apos;ll
              flag plans that are too aggressive.
            </p>
            <div>
              <div className="metric-label mb-2">Primary focus</div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { v: "lose_fat", label: "Lose fat", sub: "Calorie deficit" },
                    { v: "build_muscle", label: "Build muscle", sub: "Surplus + lifting" },
                    { v: "maintain", label: "Maintain", sub: "Hold steady" },
                    { v: "recomp", label: "Recomp", sub: "Lean out + add muscle" },
                  ] as const
                ).map((g) => {
                  const sel = form.primary_goal === g.v;
                  return (
                    <button
                      key={g.v}
                      type="button"
                      onClick={() => setForm({ ...form, primary_goal: g.v })}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left transition",
                        sel
                          ? "border-accent-blue/50 bg-accent-blue/10"
                          : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]",
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-bold",
                          sel ? "text-accent-blue" : "text-chalk-100",
                        )}
                      >
                        {g.label}
                      </div>
                      <div className="text-[11px] text-chalk-400">{g.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
            <NumberCard label="Goal weight" unit="lbs" value={form.goal_weight} min={80} max={500} onChange={(v) => setForm({ ...form, goal_weight: v })} accent />
            <div>
              <div className="metric-label mb-2">Timeframe</div>
              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setForm({ ...form, weeks_to_goal: w })}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-bold transition",
                      form.weeks_to_goal === w
                        ? "border-accent-blue bg-accent-blue text-ink-950"
                        : "border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/10",
                    )}
                  >
                    {w}w
                  </button>
                ))}
              </div>
              <div className="mt-3 text-sm text-chalk-300">
                {form.weeks_to_goal} weeks Â·{" "}
                <span className="font-bold text-accent-blue">
                  {stats.weeklyLoss} lbs/week
                </span>
                {stats.aggressive && (
                  <span className="ml-2 text-accent-orange">
                    âš  aggressive â€” try a longer timeframe
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Lifestyle
            </h1>
            <p className="text-sm text-chalk-300">
              How active is your day before workouts?
            </p>
            <div className="space-y-2">
              {(Object.keys(LIFESTYLE) as Array<keyof typeof LIFESTYLE>).map(
                (k) => {
                  const opt = LIFESTYLE[k];
                  const sel = form.lifestyle === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setForm({ ...form, lifestyle: k })}
                      className={cn(
                        "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition",
                        sel
                          ? "border-accent-blue/50 bg-accent-blue/10"
                          : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]",
                      )}
                    >
                      <div>
                        <div
                          className={cn(
                            "text-sm font-bold",
                            sel ? "text-accent-blue" : "text-chalk-100",
                          )}
                        >
                          {opt.label}
                        </div>
                        <div className="text-xs text-chalk-400">{opt.desc}</div>
                      </div>
                      <div className="text-xs text-chalk-400">
                        Ã—{opt.multiplier}
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            <div>
              <div className="metric-label mb-2">Where will you train?</div>
              <div className="grid grid-cols-3 gap-2">
                {(["home", "gym", "both"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setForm({ ...form, workout_mode: m })}
                    className={cn(
                      "btn-secondary capitalize",
                      form.workout_mode === m &&
                        "border-accent-blue/60 bg-accent-blue/10 text-accent-blue",
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <NumberCard
              label="Daily step goal"
              unit="steps"
              value={form.daily_step_goal}
              min={2000}
              max={20000}
              step={500}
              onChange={(v) => setForm({ ...form, daily_step_goal: v })}
            />

            <div>
              <div className="metric-label mb-2">Fitness experience</div>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { v: "beginner", label: "Beginner", sub: "<6 mo lifting" },
                    { v: "intermediate", label: "Intermediate", sub: "6 mo â€“ 2 yrs" },
                    { v: "advanced", label: "Advanced", sub: "2+ yrs lifting" },
                  ] as const
                ).map((e) => {
                  const sel = form.fitness_experience === e.v;
                  return (
                    <button
                      key={e.v}
                      type="button"
                      onClick={() => setForm({ ...form, fitness_experience: e.v })}
                      className={cn(
                        "rounded-xl border px-2 py-2.5 text-center transition",
                        sel
                          ? "border-accent-blue/50 bg-accent-blue/10"
                          : "border-white/10 bg-white/[0.025] hover:bg-white/[0.05]",
                      )}
                    >
                      <div
                        className={cn(
                          "text-sm font-bold",
                          sel ? "text-accent-blue" : "text-chalk-100",
                        )}
                      >
                        {e.label}
                      </div>
                      <div className="text-[10px] text-chalk-400">{e.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h1 className="text-3xl font-extrabold tracking-tight">
              Your plan
            </h1>
            <p className="text-sm text-chalk-300">
              Here&apos;s what we calculated. You can change all of this any
              time from your profile.
            </p>
            <div className="card-elev p-5">
              <div className="flex items-center gap-2 text-accent-blue">
                <Sparkles className="h-4 w-4" />
                <div className="metric-label text-accent-blue">
                  Daily calorie target
                </div>
              </div>
              <div className="mt-2 text-4xl font-black text-chalk-50">
                {stats.avgWorkoutTarget.toLocaleString()}
              </div>
              <div className="text-xs text-chalk-400">
                on workout days Â· {stats.restTarget.toLocaleString()} on rest
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: "Protein", v: stats.proteinG, unit: "g", color: "text-accent-violet" },
                  { label: "Carbs", v: stats.workoutMacros.carbG, unit: "g", color: "text-accent-blue" },
                  { label: "Fat", v: stats.workoutMacros.fatG, unit: "g", color: "text-accent-amber" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="metric-label">{m.label}</div>
                    <div className={`text-xl font-extrabold ${m.color}`}>
                      {m.v}
                      <span className="ml-0.5 text-[10px] text-chalk-400">
                        {m.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <Stat label="BMR" v={stats.bmr.toLocaleString()} />
                <Stat label="Life TDEE" v={stats.lifeTDEE.toLocaleString()} />
                <Stat label="Daily deficit" v={`-${stats.dailyDeficit.toLocaleString()}`} accent="text-accent-rose" />
                <Stat label="Weekly loss" v={`${stats.weeklyLoss} lbs`} accent="text-accent-green" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center gap-2">
        {step > 0 ? (
          <button
            onClick={prev}
            type="button"
            className="btn-secondary flex-1"
            disabled={pending}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        ) : null}
        {!can ? (
          <button onClick={next} type="button" className="btn-primary flex-1">
            Continue <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={finish}
            type="button"
            className="btn-primary flex-1"
            disabled={pending}
          >
            {pending ? "Savingâ€¦" : "Start tracking"}
          </button>
        )}
      </div>
    </div>
  );
}

function NumberCard({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  accent,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  accent?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        accent
          ? "border-accent-blue/30 bg-accent-blue/5"
          : "border-white/10 bg-white/[0.03]",
      )}
    >
      <div className="metric-label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <input
          type="number"
          inputMode="numeric"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={cn(
            "w-24 border-none bg-transparent p-0 text-3xl font-black outline-none",
            accent ? "text-accent-blue" : "text-chalk-50",
          )}
        />
        <span className="text-[11px] text-chalk-400">{unit}</span>
      </div>
    </div>
  );
}

function Stat({
  label,
  v,
  accent,
}: {
  label: string;
  v: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="metric-label">{label}</div>
      <div className={cn("mt-1 text-lg font-extrabold", accent ?? "text-chalk-100")}>
        {v}
      </div>
    </div>
  );
}
