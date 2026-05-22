"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Salad,
  Flame,
  LineChart,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  accent: string;
  render: () => React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "Daily Overview",
    title: "Your day at a glance.",
    body: "Rings for calories, protein, steps and water. Tap any ring to drill into the day.",
    accent: "#22d3ee",
    render: OverviewMock,
  },
  {
    eyebrow: "Workouts",
    title: "Home & gym, side by side.",
    body: "A polished 6-day split with dumbbell swaps for home. Every move has a demo and a search link.",
    accent: "#a78bfa",
    render: WorkoutMock,
  },
  {
    eyebrow: "Diet",
    title: "Track what you eat. Save what you love.",
    body: "Split meals across breakfast, snack, lunch and dinner. Save any meal as a one-tap recipe.",
    accent: "#4ade80",
    render: DietMock,
  },
  {
    eyebrow: "Wellness",
    title: "Warm up, stretch, breathe.",
    body: "Three difficulties per routine — 5, 10 or 15 minutes. Tap to play. No subscription wall.",
    accent: "#fb923c",
    render: WellnessMock,
  },
  {
    eyebrow: "Plan",
    title: "The math, made for you.",
    body: "BMR, TDEE, deficit and macro targets — computed from your body, refreshed on every change.",
    accent: "#f472b6",
    render: PlanMock,
  },
];

export function FeatureCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // Track which slide is most-visible to highlight the dot.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = Array.from(track.querySelectorAll<HTMLElement>("[data-slide]"));
    if (slides.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const i = Number(visible.target.getAttribute("data-slide"));
          if (!Number.isNaN(i)) setIndex(i);
        }
      },
      { root: track, threshold: [0.5, 0.75, 1] },
    );
    slides.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollBy = (dir: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector<HTMLElement>("[data-slide]");
    const step = slide?.getBoundingClientRect().width ?? track.clientWidth * 0.85;
    track.scrollBy({ left: dir * (step + 16), behavior: "smooth" });
  };

  const scrollTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector<HTMLElement>(`[data-slide="${i}"]`);
    slide?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-6 sm:-mx-6 sm:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SLIDES.map((s, i) => (
          <article
            key={s.eyebrow}
            data-slide={i}
            className="card-elev flex w-[85%] shrink-0 snap-center flex-col gap-5 p-5 sm:w-[440px] sm:p-6"
          >
            <PhoneFrame accent={s.accent}>{s.render()}</PhoneFrame>
            <div>
              <div
                className="text-[10px] font-bold uppercase tracking-[2px]"
                style={{ color: s.accent }}
              >
                {s.eyebrow}
              </div>
              <h3 className="mt-2 text-lg font-extrabold text-chalk-50 sm:text-xl">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-chalk-300">
                {s.body}
              </p>
            </div>
          </article>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label="Previous"
          onClick={() => scrollBy(-1)}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-chalk-200 transition hover:bg-white/10"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => scrollTo(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === i ? "w-6 bg-accent-cyan" : "w-1.5 bg-white/20",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next"
          onClick={() => scrollBy(1)}
          className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-chalk-200 transition hover:bg-white/10"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PhoneFrame({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative aspect-[9/16] w-full overflow-hidden rounded-[28px] border border-white/[0.08] bg-ink-950"
      style={{
        boxShadow: `0 30px 80px -40px ${accent}66, inset 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${accent}22, transparent 70%)`,
        }}
      />
      <div className="relative h-full w-full p-4 text-chalk-50">{children}</div>
    </div>
  );
}

// ─── Mockups ────────────────────────────────────────────────────────────────

function MockHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <div className="text-[9px] font-bold uppercase tracking-[2px] text-chalk-400">
          {sub}
        </div>
        <div className="text-base font-extrabold tracking-tight">{title}</div>
      </div>
      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-accent-cyan/40 to-accent-violet/40 ring-1 ring-white/10" />
    </div>
  );
}

function Ring({
  pct,
  color,
  size = 64,
  stroke = 6,
  children,
}: {
  pct: number;
  color: string;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

function OverviewMock() {
  return (
    <>
      <MockHeader title="Today" sub="Thu · May 22" />
      <div className="mb-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[2px] text-chalk-400">
              Calories left
            </div>
            <div className="text-2xl font-black text-accent-cyan">820</div>
            <div className="text-[10px] text-chalk-400">of 2,180 today</div>
          </div>
          <Ring pct={0.62} color="#22d3ee" size={60}>
            <div className="text-[10px] font-bold">62%</div>
          </Ring>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Protein", pct: 0.72, color: "#a78bfa", v: "118g" },
          { label: "Steps", pct: 0.48, color: "#4ade80", v: "3.8k" },
          { label: "Water", pct: 0.55, color: "#38bdf8", v: "44oz" },
        ].map((m) => (
          <div
            key={m.label}
            className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-2"
          >
            <Ring pct={m.pct} color={m.color} size={44} stroke={4}>
              <div className="text-[8px] font-bold">{Math.round(m.pct * 100)}%</div>
            </Ring>
            <div className="mt-1 text-[10px] font-bold text-chalk-100">{m.v}</div>
            <div className="text-[8px] uppercase tracking-wider text-chalk-400">
              {m.label}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-accent-cyan/20 bg-accent-cyan/[0.06] p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent-cyan">
          <Sparkles className="h-3 w-3" /> Suggested
        </div>
        <div className="mt-0.5 text-[11px] text-chalk-200">
          Walk 22 min to close today&apos;s gap
        </div>
      </div>
    </>
  );
}

function WorkoutMock() {
  const exercises = [
    { name: "Flat Bench Press", sets: "8, 10, 8, 6" },
    { name: "Incline DB Press", sets: "10, 10, 8, 8" },
    { name: "Cable Fly", sets: "15, 12, 12" },
    { name: "Tricep Pushdown", sets: "12, 10, 10, 8" },
  ];
  return (
    <>
      <MockHeader title="Chest + Triceps" sub="Day 3 · Fri" />
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full bg-accent-violet/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-violet">
          ~60 min
        </span>
        <span className="rounded-full bg-accent-orange/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-orange">
          EPOC
        </span>
      </div>
      <div className="space-y-1.5">
        {exercises.map((e) => (
          <div
            key={e.name}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.025] p-2"
          >
            <div className="flex items-center gap-2">
              <Dumbbell className="h-3 w-3 text-accent-violet" />
              <div className="text-[11px] font-bold">{e.name}</div>
            </div>
            <div className="text-[10px] text-chalk-400">{e.sets}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2 text-center">
          <div className="text-[9px] uppercase tracking-wider text-chalk-400">
            Home
          </div>
          <div className="text-[11px] font-bold">DB swaps ready</div>
        </div>
        <div className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/[0.06] p-2 text-center">
          <div className="text-[9px] uppercase tracking-wider text-accent-cyan">
            Gym
          </div>
          <div className="text-[11px] font-bold text-accent-cyan">Selected</div>
        </div>
      </div>
    </>
  );
}

function DietMock() {
  const meals = [
    { type: "Breakfast", items: "Oats · Eggs · Berries", kcal: 480, c: "#fbbf24" },
    { type: "Lunch", items: "Chicken · Rice · Greens", kcal: 620, c: "#4ade80" },
    { type: "Snack", items: "Greek yogurt", kcal: 180, c: "#f472b6" },
    { type: "Dinner", items: "Salmon · Sweet potato", kcal: 720, c: "#38bdf8" },
  ];
  return (
    <>
      <MockHeader title="Diet" sub="2,000 cal · 150g protein" />
      <div className="mb-3 grid grid-cols-3 gap-2">
        {[
          { l: "Protein", v: "118g", c: "#a78bfa" },
          { l: "Carbs", v: "220g", c: "#22d3ee" },
          { l: "Fat", v: "62g", c: "#fbbf24" },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
          >
            <div className="text-[9px] uppercase tracking-wider text-chalk-400">
              {m.l}
            </div>
            <div className="text-sm font-extrabold" style={{ color: m.c }}>
              {m.v}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {meals.map((m) => (
          <div
            key={m.type}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.025] p-2"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: m.c }}
              />
              <div>
                <div className="text-[11px] font-bold">{m.type}</div>
                <div className="text-[10px] text-chalk-400">{m.items}</div>
              </div>
            </div>
            <div className="text-[11px] font-bold text-chalk-100">
              {m.kcal}
              <span className="ml-0.5 text-[8px] text-chalk-400">kcal</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-accent-green/25 bg-accent-green/[0.06] p-2 text-[10px] font-bold text-accent-green">
        <Salad className="h-3 w-3" /> Save dinner as a recipe
      </div>
    </>
  );
}

function WellnessMock() {
  const routines = [
    { icon: "🔥", title: "Warm Up", c: "#fb923c" },
    { icon: "💪", title: "Core", c: "#4ade80" },
    { icon: "🧘", title: "Stretches", c: "#38bdf8" },
    { icon: "🌿", title: "Meditation", c: "#a78bfa" },
  ];
  return (
    <>
      <MockHeader title="Wellness" sub="Routines · 3 levels" />
      <div className="space-y-2">
        {routines.map((r) => (
          <div
            key={r.title}
            className="rounded-xl border p-2.5"
            style={{ background: `${r.c}10`, borderColor: `${r.c}33` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base leading-none">{r.icon}</span>
                <div className="text-[11px] font-bold">{r.title}</div>
              </div>
              <Flame className="h-3 w-3" style={{ color: r.c }} />
            </div>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {["5", "10", "15"].map((t) => (
                <div
                  key={t}
                  className="rounded-md border px-1.5 py-1 text-center text-[9px] font-bold"
                  style={{ borderColor: `${r.c}30`, color: r.c }}
                >
                  {t} min
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PlanMock() {
  return (
    <>
      <MockHeader title="Your plan" sub="Computed" />
      <div className="rounded-2xl border border-accent-cyan/20 bg-accent-cyan/[0.06] p-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent-cyan">
          <LineChart className="h-3 w-3" /> Daily target
        </div>
        <div className="mt-1 text-3xl font-black text-chalk-50">2,180</div>
        <div className="text-[10px] text-chalk-400">workout day · 1,830 rest</div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { l: "Protein", v: "165g", c: "#a78bfa" },
          { l: "Carbs", v: "240g", c: "#22d3ee" },
          { l: "Fat", v: "60g", c: "#fbbf24" },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-2 text-center"
          >
            <div className="text-[9px] uppercase tracking-wider text-chalk-400">
              {m.l}
            </div>
            <div className="text-base font-extrabold" style={{ color: m.c }}>
              {m.v}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { l: "BMR", v: "1,640" },
          { l: "Life TDEE", v: "2,060" },
          { l: "Deficit", v: "-500", c: "text-accent-rose" },
          { l: "Weekly", v: "1.0 lbs", c: "text-accent-green" },
        ].map((m) => (
          <div
            key={m.l}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
          >
            <div className="text-[9px] uppercase tracking-wider text-chalk-400">
              {m.l}
            </div>
            <div className={cn("text-sm font-extrabold text-chalk-100", m.c)}>
              {m.v}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
