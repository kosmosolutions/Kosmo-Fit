"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, Sparkles } from "lucide-react";
import { LIFESTYLE, calcStats } from "@/lib/calc";
import { saveProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";
import type { WeightPoint } from "@/lib/actions/weight";
import { Ring } from "@/components/Ring";
import { WeightTrendChart } from "@/components/WeightTrendChart";
import { MacroOverrideEditor } from "@/components/MacroOverrideEditor";
import { useUnitPref } from "@/lib/useUnitPref";
import {
  lbToKg,
  kgToLb,
  ftInToCm,
  cmToFtIn,
  type WeightUnit,
  type HeightUnit,
} from "@/lib/units";
import { cn } from "@/lib/cn";

const TIMEFRAMES = [12, 16, 20, 24, 30, 40, 52];
const ACCENT = "#0A84FF";

export function ProfileEditor({
  profile,
  email,
  weightHistory,
}: {
  profile: Profile;
  email: string;
  weightHistory: WeightPoint[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [wUnit, setWUnit] = useUnitPref<WeightUnit>("weight", "lb");
  const [hUnit, setHUnit] = useUnitPref<HeightUnit>("height", "ftin");
  const [f, setF] = useState({
    full_name: profile.full_name ?? "",
    sex: profile.sex,
    age: profile.age,
    height_ft: profile.height_ft,
    height_in: profile.height_in,
    current_weight: profile.current_weight,
    goal_weight: profile.goal_weight,
    weeks_to_goal: profile.weeks_to_goal,
    lifestyle: profile.lifestyle,
    workout_mode: profile.workout_mode,
    daily_step_goal: profile.daily_step_goal,
    fitness_experience: (profile.fitness_experience ?? "beginner") as
      | "beginner"
      | "intermediate"
      | "advanced",
    primary_goal: (profile.primary_goal ?? "lose_fat") as
      | "lose_fat"
      | "build_muscle"
      | "maintain"
      | "recomp",
    notes: profile.notes ?? "",
  });

  const stats = useMemo(
    () =>
      calcStats(
        {
          current_weight: f.current_weight,
          goal_weight: f.goal_weight,
          height_ft: f.height_ft,
          height_in: f.height_in,
          age: f.age,
          sex: f.sex,
          lifestyle: f.lifestyle,
          weeks_to_goal: f.weeks_to_goal,
        },
        f.workout_mode === "gym" ? "gym" : "home",
      ),
    [f],
  );

  function save() {
    start(async () => {
      await saveProfile(f);
      setSaved(true);
      router.push("/overview");
    });
  }

  const current = Number(f.current_weight) || 0;
  const goal = Number(f.goal_weight) || 0;
  const delta = current - goal;
  const cutting = delta >= 0;
  const toChange = Math.abs(delta);

  const startWeight = weightHistory.length ? weightHistory[0].weight : current;
  const totalSpan = Math.abs(startWeight - goal);
  const done = Math.abs(startWeight - current);
  const progressPct = totalSpan > 0.5 ? Math.min(1, Math.max(0, done / totalSpan)) : 0;
  const showProgress = weightHistory.length >= 2 && totalSpan > 0.5;

  const initials =
    ((f.full_name?.trim() || email)
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("") || "U").toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-[18px] font-black text-white shadow-bento ring-1 ring-white/10"
            style={{
              background: "linear-gradient(135deg, #0A84FF 0%, #64D2FF 100%)",
            }}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="metric-label">Profile</div>
            <h1 className="display truncate text-[26px] leading-tight text-white">
              {f.full_name || "Your account"}
            </h1>
            <div className="truncate text-[12px] font-medium text-chalk-400">
              {email}
            </div>
          </div>
        </div>
        <a
          href="/auth/logout"
          aria-label="Sign out"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-800 text-chalk-400 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-accent-rose/15 hover:text-accent-rose"
        >
          <LogOut className="h-4 w-4" />
        </a>
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-accent-blue">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="metric-label text-accent-blue">Plan summary</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-[32px] font-black tracking-tightest text-white">
                {current}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-chalk-500" />
              <span className="font-display text-[32px] font-black tracking-tightest text-accent-blue">
                {goal}
              </span>
              <span className="text-[14px] font-semibold text-chalk-400">lb</span>
            </div>
            <div className="mt-1 text-[12px] font-medium text-chalk-400">
              {toChange < 0.5
                ? "Maintaining current weight"
                : `${toChange.toLocaleString()} lb to ${cutting ? "lose" : "gain"} · ${stats.weeklyLoss} lb/wk`}
            </div>
          </div>
          {showProgress ? (
            <div className="relative grid h-[80px] w-[80px] shrink-0 place-items-center">
              <Ring pct={progressPct} color={ACCENT} size={80} stroke={8} />
              <div className="absolute text-center leading-none">
                <div className="text-[15px] font-black text-white">
                  {Math.round(progressPct * 100)}%
                </div>
                <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-chalk-400">
                  there
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label={cutting ? "To lose" : "To gain"} value={toChange.toLocaleString()} unit="lb" />
          <Stat label="Per week" value={String(stats.weeklyLoss)} unit="lb" />
          <Stat label="Timeframe" value={String(f.weeks_to_goal)} unit="wk" />
        </div>

        <div className="mt-3 rounded-2xl bg-ink-800 px-4 py-3 text-[12px] font-medium text-chalk-300">
          Daily base{" "}
          <span className="font-semibold text-white">
            {stats.restTarget.toLocaleString()} cal
          </span>{" "}
          · earn up to{" "}
          <span className="font-semibold text-accent-green">
            +{Math.max(...stats.burns)} cal
          </span>{" "}
          when you complete a workout
          {stats.aggressive ? (
            <span className="font-semibold text-accent-orange"> · aggressive pace</span>
          ) : null}
        </div>
      </section>

      <WeightTrendChart
        points={weightHistory}
        currentWeight={Number(f.current_weight) || 0}
        goalWeight={Number(f.goal_weight) || 0}
        windowDays={90}
        plannedWeeklyLoss={stats.weeklyLoss}
      />

      <Section title="About you">
        <label className="block">
          <span className="metric-label">Full name</span>
          <input
            value={f.full_name}
            onChange={(e) => setF({ ...f, full_name: e.target.value })}
            className="field mt-1"
          />
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(["male", "female", "other"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setF({ ...f, sex: s })}
              className={cn(
                "btn capitalize",
                f.sex === s
                  ? "bg-accent-blue/20 text-accent-blue"
                  : "bg-ink-800 text-chalk-200 hover:bg-ink-700",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Body">
        <div className="grid grid-cols-2 gap-2">
          <Num label="Age" unit="yrs" v={f.age} min={13} max={100}
            onChange={(v) => setF({ ...f, age: v })} />
          <HeightTile
            hUnit={hUnit}
            onUnit={(u) => setHUnit(u)}
            ft={f.height_ft}
            inch={f.height_in}
            onChange={(ft, inch) => setF({ ...f, height_ft: ft, height_in: inch })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Num
            label="Current weight"
            unit={wUnit}
            v={wUnit === "kg" ? +lbToKg(f.current_weight).toFixed(1) : f.current_weight}
            min={wUnit === "kg" ? 36 : 80}
            max={wUnit === "kg" ? 227 : 500}
            step={0.5}
            onChange={(v) =>
              setF({ ...f, current_weight: wUnit === "kg" ? +kgToLb(v).toFixed(1) : v })
            }
            headerRight={
              <UnitTabs
                value={wUnit}
                options={[
                  { value: "lb", label: "lb" },
                  { value: "kg", label: "kg" },
                ]}
                onChange={(u) => setWUnit(u)}
              />
            }
          />
          <Num
            label="Goal weight"
            unit={wUnit}
            v={wUnit === "kg" ? +lbToKg(f.goal_weight).toFixed(1) : f.goal_weight}
            min={wUnit === "kg" ? 36 : 80}
            max={wUnit === "kg" ? 227 : 500}
            step={0.5}
            accent
            onChange={(v) =>
              setF({ ...f, goal_weight: wUnit === "kg" ? +kgToLb(v).toFixed(1) : v })
            }
            headerRight={
              <UnitTabs
                value={wUnit}
                options={[
                  { value: "lb", label: "lb" },
                  { value: "kg", label: "kg" },
                ]}
                onChange={(u) => setWUnit(u)}
              />
            }
          />
        </div>
      </Section>

      <Section title="Timeframe">
        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setF({ ...f, weeks_to_goal: w })}
              className={cn(
                "min-h-[40px] rounded-full px-4 text-[13px] font-semibold transition-all duration-200 ease-ios active:scale-[0.96]",
                f.weeks_to_goal === w
                  ? "bg-accent-blue text-white"
                  : "bg-ink-800 text-chalk-300 hover:bg-ink-700",
              )}
            >
              {w}w
            </button>
          ))}
        </div>
        <div className="text-[13px] font-medium text-chalk-300">
          {f.weeks_to_goal} weeks ·{" "}
          <span
            className={cn(
              "font-bold",
              stats.aggressive ? "text-accent-orange" : "text-accent-blue",
            )}
          >
            {stats.weeklyLoss} lb/wk
          </span>
          {stats.aggressive && (
            <span className="ml-2 font-semibold text-accent-orange">
              Aggressive — consider a longer timeframe
            </span>
          )}
        </div>
      </Section>

      <Section title="Goal & experience">
        <div>
          <div className="metric-label mb-2">Primary focus</div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { v: "lose_fat", label: "Lose fat" },
                { v: "build_muscle", label: "Build muscle" },
                { v: "maintain", label: "Maintain" },
                { v: "recomp", label: "Recomp" },
              ] as const
            ).map((g) => (
              <button
                key={g.v}
                type="button"
                onClick={() => setF({ ...f, primary_goal: g.v })}
                className={cn(
                  "min-h-[48px] rounded-2xl px-4 text-left text-[14px] font-semibold transition-all duration-200 ease-ios active:scale-[0.98]",
                  f.primary_goal === g.v
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "bg-ink-800 text-white hover:bg-ink-700",
                )}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="metric-label mb-2">Fitness experience</div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { v: "beginner", label: "Beginner" },
                { v: "intermediate", label: "Intermediate" },
                { v: "advanced", label: "Advanced" },
              ] as const
            ).map((e) => (
              <button
                key={e.v}
                type="button"
                onClick={() => setF({ ...f, fitness_experience: e.v })}
                className={cn(
                  "btn",
                  f.fitness_experience === e.v
                    ? "bg-accent-blue/20 text-accent-blue"
                    : "bg-ink-800 text-chalk-200 hover:bg-ink-700",
                )}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Macros">
        <MacroOverrideEditor
          initialProtein={profile.macro_protein_pct}
          initialCarb={profile.macro_carb_pct}
          initialFat={profile.macro_fat_pct}
          previewCalories={stats.avgWorkoutTarget}
          defaultProteinG={stats.proteinG}
        />
      </Section>

      <Section title="Lifestyle">
        <div className="space-y-2">
          {(Object.keys(LIFESTYLE) as Array<keyof typeof LIFESTYLE>).map((k) => {
            const opt = LIFESTYLE[k];
            const sel = f.lifestyle === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setF({ ...f, lifestyle: k })}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all duration-200 ease-ios active:scale-[0.98]",
                  sel
                    ? "bg-accent-blue/15"
                    : "bg-ink-800 hover:bg-ink-700",
                )}
              >
                <div>
                  <div className={cn(
                    "text-[15px] font-semibold",
                    sel ? "text-accent-blue" : "text-white",
                  )}>
                    {opt.label}
                  </div>
                  <div className="text-[12px] font-medium text-chalk-400">
                    {opt.desc}
                  </div>
                </div>
                <div className="text-[12px] font-medium text-chalk-400">
                  ×{opt.multiplier}
                </div>
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["home", "gym", "both"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setF({ ...f, workout_mode: m })}
              className={cn(
                "btn capitalize",
                f.workout_mode === m
                  ? "bg-accent-blue/20 text-accent-blue"
                  : "bg-ink-800 text-chalk-200 hover:bg-ink-700",
              )}
            >
              {m}
            </button>
          ))}
        </div>
        <Num
          label="Daily step goal"
          unit="steps"
          v={f.daily_step_goal}
          min={2000}
          max={20000}
          step={500}
          onChange={(v) => setF({ ...f, daily_step_goal: v })}
        />
      </Section>

      <Section title="Notes">
        <textarea
          rows={3}
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          placeholder="Anything else — injuries, dietary preferences, motivation…"
          className="field resize-y"
        />
      </Section>

      <button
        onClick={save}
        disabled={pending}
        className="btn-primary w-full"
      >
        {pending ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
      </button>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl bg-ink-800 px-3 py-2.5">
      <div className="metric-label">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="font-display text-[22px] font-black tracking-tightest text-white">
          {value}
        </span>
        <span className="text-[11px] font-medium text-chalk-400">{unit}</span>
      </div>
    </div>
  );
}

function UnitTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-ink-900 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "min-h-[28px] rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-200 ease-ios",
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="metric-label">{title}</div>
      <div className="card space-y-3 p-4">{children}</div>
    </section>
  );
}

function HeightTile({
  hUnit,
  onUnit,
  ft,
  inch,
  onChange,
}: {
  hUnit: HeightUnit;
  onUnit: (u: HeightUnit) => void;
  ft: number;
  inch: number;
  onChange: (ft: number, inch: number) => void;
}) {
  const inputCls =
    "border-none bg-transparent p-0 font-display text-[26px] font-black tracking-tightest text-white outline-none";
  return (
    <div className="rounded-2xl bg-ink-800 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="metric-label">Height</div>
        <UnitTabs
          value={hUnit}
          options={[
            { value: "ftin", label: "ft / in" },
            { value: "cm", label: "cm" },
          ]}
          onChange={onUnit}
        />
      </div>
      {hUnit === "ftin" ? (
        <div className="mt-1 flex items-baseline gap-1">
          <input
            type="number"
            inputMode="numeric"
            value={ft}
            min={4}
            max={7}
            onChange={(e) => onChange(parseInt(e.target.value) || 0, inch)}
            className={cn(inputCls, "w-9")}
          />
          <span className="text-[11px] font-medium text-chalk-400">ft</span>
          <input
            type="number"
            inputMode="numeric"
            value={inch}
            min={0}
            max={11}
            onChange={(e) => onChange(ft, parseInt(e.target.value) || 0)}
            className={cn(inputCls, "ml-2 w-9")}
          />
          <span className="text-[11px] font-medium text-chalk-400">in</span>
        </div>
      ) : (
        <CmInput
          cm={ftInToCm(ft, inch)}
          onCommit={(cm) => {
            const { ft: nf, inch: ni } = cmToFtIn(cm);
            onChange(nf, ni);
          }}
          className={cn(inputCls, "w-20")}
        />
      )}
    </div>
  );
}

/**
 * The cm field keeps its own text state while focused: the canonical value
 * is ft/in, and a keystroke-by-keystroke cm → ft/in → cm round-trip rounds
 * mid-typing (typing "175" lands on 84). Convert once, on blur.
 */
function CmInput({
  cm,
  onCommit,
  className,
}: {
  cm: number;
  onCommit: (cm: number) => void;
  className?: string;
}) {
  const [text, setText] = useState(String(cm));
  const [focused, setFocused] = useState(false);
  return (
    <div className="mt-1 flex items-baseline gap-1">
      <input
        type="number"
        inputMode="numeric"
        value={focused ? text : String(cm)}
        min={120}
        max={220}
        onFocus={() => {
          setText(String(cm));
          setFocused(true);
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          setFocused(false);
          const n = parseInt(text);
          if (Number.isFinite(n) && n > 0) {
            onCommit(Math.min(220, Math.max(120, n)));
          }
        }}
        className={className}
      />
      <span className="text-[11px] font-medium text-chalk-400">cm</span>
    </div>
  );
}

function Num({
  label,
  unit,
  v,
  min,
  max,
  step = 1,
  accent,
  onChange,
  headerRight,
}: {
  label: string;
  unit: string;
  v: number;
  min: number;
  max: number;
  step?: number;
  accent?: boolean;
  onChange: (n: number) => void;
  headerRight?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-3",
        accent ? "bg-accent-blue/10" : "bg-ink-800",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="metric-label">{label}</div>
        {headerRight}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={v}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={cn(
            "w-full border-none bg-transparent p-0 font-display text-[26px] font-black tracking-tightest outline-none",
            accent ? "text-accent-blue" : "text-white",
          )}
        />
        <span className="text-[11px] font-medium text-chalk-400">{unit}</span>
      </div>
    </div>
  );
}
