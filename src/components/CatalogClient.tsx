"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Dumbbell,
  ExternalLink,
  LayoutGrid,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

const FED_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

type Level = "beginner" | "intermediate" | "expert";

interface CatalogExercise {
  id: string;
  name: string;
  level: Level;
  equipment: string | null;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
}

// Hero muscle-group browser. Each tile is a discoverable category — emoji is a
// lightweight stand-in for an SVG icon and the gradient gives the editorial pop.
type MuscleGroup = {
  key: string;
  label: string;
  emoji: string;
  gradient: string;
  matches: string[]; // primaryMuscle values it includes
};

const MUSCLE_GROUPS: MuscleGroup[] = [
  {
    key: "chest",
    label: "Chest",
    emoji: "💪",
    gradient: "from-rose-500/40 to-rose-500/0",
    matches: ["chest"],
  },
  {
    key: "back",
    label: "Back",
    emoji: "🪨",
    gradient: "from-indigo-500/40 to-indigo-500/0",
    matches: ["lats", "middle back", "lower back", "traps"],
  },
  {
    key: "shoulders",
    label: "Shoulders",
    emoji: "🏔️",
    gradient: "from-amber-500/40 to-amber-500/0",
    matches: ["shoulders"],
  },
  {
    key: "arms",
    label: "Arms",
    emoji: "💥",
    gradient: "from-fuchsia-500/40 to-fuchsia-500/0",
    matches: ["biceps", "triceps", "forearms"],
  },
  {
    key: "core",
    label: "Core",
    emoji: "🔥",
    gradient: "from-orange-500/40 to-orange-500/0",
    matches: ["abdominals"],
  },
  {
    key: "legs",
    label: "Legs",
    emoji: "🦵",
    gradient: "from-emerald-500/40 to-emerald-500/0",
    matches: ["quadriceps", "hamstrings", "glutes", "calves", "adductors", "abductors"],
  },
  {
    key: "full",
    label: "Full body",
    emoji: "⚡",
    gradient: "from-accent-blue/50 to-accent-cyan/0",
    matches: [], // selected via category fallback
  },
];

const EQUIPMENT_FACETS = [
  "body only",
  "dumbbell",
  "barbell",
  "cable",
  "machine",
  "kettlebells",
  "bands",
  "e-z curl bar",
  "exercise ball",
  "medicine ball",
  "foam roll",
  "other",
] as const;

const LEVEL_FACETS: Level[] = ["beginner", "intermediate", "expert"];

const LEVEL_COLOR: Record<Level, string> = {
  beginner: "#22c55e",
  intermediate: "#f59e0b",
  expert: "#f43f5e",
};

const PAGE_SIZE = 36;

function useFrameCycle(frameCount: number, intervalMs = 800) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (frameCount < 2) return;
    const id = setInterval(
      () => setFrame((f) => (f + 1) % frameCount),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [frameCount, intervalMs]);
  return frame;
}

function FrameLoop({
  images,
  alt,
  className,
}: {
  images: string[];
  alt: string;
  className?: string;
}) {
  const frame = useFrameCycle(images.length);
  return (
    <div className={`relative ${className ?? ""}`}>
      {images.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={i === 0 ? alt : ""}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150"
          style={{ opacity: i === frame ? 1 : 0 }}
          loading="lazy"
        />
      ))}
    </div>
  );
}

export function CatalogClient() {
  const [all, setAll] = useState<CatalogExercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState<CatalogExercise | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/exercise-catalog.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CatalogExercise[]>;
      })
      .then((data) => {
        if (!cancelled) setAll(data);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, group, equipment, level]);

  // Per-group counts shown on the hero tiles
  const groupCounts = useMemo(() => {
    if (!all) return {} as Record<string, number>;
    const out: Record<string, number> = {};
    for (const g of MUSCLE_GROUPS) {
      if (g.key === "full") {
        out[g.key] = all.filter(
          (e) => (e.category ?? "") === "cardio" || (e.category ?? "") === "stretching",
        ).length;
      } else {
        out[g.key] = all.filter((e) =>
          e.primaryMuscles.some((m) => g.matches.includes(m)),
        ).length;
      }
    }
    return out;
  }, [all]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    const activeGroup = group ? MUSCLE_GROUPS.find((g) => g.key === group) : null;
    return all.filter((e) => {
      if (level && e.level !== level) return false;
      if (equipment && (e.equipment ?? "body only") !== equipment) return false;
      if (activeGroup) {
        if (activeGroup.key === "full") {
          if ((e.category ?? "") !== "cardio" && (e.category ?? "") !== "stretching") {
            return false;
          }
        } else if (!e.primaryMuscles.some((m) => activeGroup.matches.includes(m))) {
          return false;
        }
      }
      if (q) {
        const hay = `${e.name} ${e.primaryMuscles.join(" ")} ${e.equipment ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, group, equipment, level]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const activeFilterCount = (equipment ? 1 : 0) + (level ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 p-5 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(0,102,255,0.45), rgba(0,168,232,0.0))",
          }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="label-eyebrow">Exercise library</div>
            <h1 className="display mt-2 text-3xl text-chalk-50 sm:text-4xl">
              Find your next move.
            </h1>
            <p className="mt-2 max-w-md text-sm text-chalk-300">
              {all
                ? `${all.length} exercises · animated form previews · YouTube tutorials per move.`
                : loadError
                  ? `Failed to load catalog: ${loadError}`
                  : "Loading catalog…"}
            </p>
          </div>
          <Link
            href="/workout"
            className="btn-secondary shrink-0"
            aria-label="Back to workout plan"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>
        </div>

        {/* Muscle group tile browser */}
        <div className="relative mt-6 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <button
            type="button"
            onClick={() => setGroup(null)}
            className={cn(
              "group/tile relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border p-3 text-center transition-all",
              group === null
                ? "border-accent-blue/50 bg-accent-blue/10 shadow-glow"
                : "border-white/[0.08] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]",
            )}
          >
            <LayoutGrid
              className={cn(
                "h-5 w-5 transition",
                group === null ? "text-accent-cyan" : "text-chalk-400",
              )}
            />
            <div
              className={cn(
                "text-[11px] font-bold uppercase tracking-wider",
                group === null ? "text-accent-cyan" : "text-chalk-200",
              )}
            >
              All
            </div>
            {all && (
              <div className="text-[10px] text-chalk-500">{all.length}</div>
            )}
          </button>
          {MUSCLE_GROUPS.map((g) => {
            const sel = group === g.key;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setGroup(sel ? null : g.key)}
                className={cn(
                  "group/tile relative flex flex-col items-center gap-1.5 overflow-hidden rounded-2xl border p-3 text-center transition-all",
                  sel
                    ? "border-accent-blue/50 shadow-glow"
                    : "border-white/[0.08] hover:border-white/20",
                )}
              >
                {/* Color flare */}
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity",
                    g.gradient,
                    !sel && "opacity-25 group-hover/tile:opacity-50",
                  )}
                />
                <div
                  className={cn(
                    "absolute inset-0 transition",
                    sel ? "bg-accent-blue/10" : "bg-white/[0.02]",
                  )}
                />
                <span className="relative text-xl leading-none">{g.emoji}</span>
                <div
                  className={cn(
                    "relative text-[11px] font-bold uppercase tracking-wider",
                    sel ? "text-accent-cyan" : "text-chalk-100",
                  )}
                >
                  {g.label}
                </div>
                <div className="relative text-[10px] text-chalk-400">
                  {groupCounts[g.key] ?? ""}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Search + filter toggle */}
      <div className="sticky top-[64px] z-10 -mx-4 border-b border-white/[0.05] bg-ink-950/90 px-4 py-3 backdrop-blur-xl md:top-[68px]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, muscle or equipment"
              className="field pl-9"
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition",
              activeFilterCount > 0
                ? "border-accent-blue/50 bg-accent-blue/10 text-accent-cyan"
                : "border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]",
            )}
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-accent-blue/30 px-1.5 text-[10px]">
                {activeFilterCount}
              </span>
            ) : null}
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                filtersOpen && "rotate-180",
              )}
            />
          </button>
        </div>

        {filtersOpen && (
          <div className="mt-3 space-y-3">
            <FacetRow
              label="Equipment"
              value={equipment}
              options={[...EQUIPMENT_FACETS]}
              onChange={setEquipment}
            />
            <FacetRow
              label="Level"
              value={level}
              options={[...LEVEL_FACETS]}
              onChange={(v) => setLevel(v as Level | null)}
            />
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setEquipment(null);
                  setLevel(null);
                }}
                className="text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Result strip */}
      <div className="flex items-center justify-between text-xs text-chalk-400">
        <div>
          {all
            ? `${filtered.length} ${filtered.length === 1 ? "exercise" : "exercises"} match`
            : loadError
              ? `Failed to load catalog: ${loadError}`
              : "Loading catalog…"}
        </div>
        {(group || equipment || level || query) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGroup(null);
              setEquipment(null);
              setLevel(null);
            }}
            className="text-[11px] font-bold uppercase tracking-wider text-accent-cyan hover:text-accent-blue"
          >
            Reset
          </button>
        )}
      </div>

      {/* Grid */}
      {all && filtered.length === 0 ? (
        <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
          <Dumbbell className="h-6 w-6 text-chalk-400" />
          <div className="text-sm font-bold text-chalk-100">
            No exercises match those filters.
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setGroup(null);
              setEquipment(null);
              setLevel(null);
            }}
            className="text-xs font-bold text-accent-cyan"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {slice.map((ex) => (
            <ExerciseGridCard
              key={ex.id}
              ex={ex}
              onClick={() => setActive(ex)}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="btn-secondary"
          >
            Load {Math.min(PAGE_SIZE, filtered.length - visible)} more
          </button>
        </div>
      )}

      {active && <ExerciseDetail exercise={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function FacetRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  options: string[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="label-tiny mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const sel = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(sel ? null : opt)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize transition",
                sel
                  ? "border-accent-blue/50 bg-accent-blue/15 text-accent-cyan"
                  : "border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseGridCard({
  ex,
  onClick,
}: {
  ex: CatalogExercise;
  onClick: () => void;
}) {
  const imageUrls = ex.images.map((p) => `${FED_BASE}/${p}`);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] text-left transition-all hover:-translate-y-0.5 hover:border-accent-blue/40 hover:shadow-glow"
    >
      <div className="relative aspect-square w-full bg-ink-900">
        {imageUrls.length > 0 ? (
          <FrameLoop
            images={imageUrls}
            alt={ex.name}
            className="h-full w-full"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-chalk-500">
            <Dumbbell className="h-6 w-6" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div
          className="absolute right-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            color: LEVEL_COLOR[ex.level],
            background: `${LEVEL_COLOR[ex.level]}25`,
          }}
        >
          {ex.level}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="line-clamp-2 text-[12px] font-bold leading-snug text-chalk-50">
          {ex.name}
        </div>
        <div className="mt-auto flex flex-wrap gap-1 text-[9px] uppercase tracking-wider text-chalk-400">
          {ex.primaryMuscles[0] && <span>{ex.primaryMuscles[0]}</span>}
          {ex.equipment && <span>· {ex.equipment}</span>}
        </div>
      </div>
    </button>
  );
}

function ExerciseDetail({
  exercise,
  onClose,
}: {
  exercise: CatalogExercise;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useBodyScrollLock();

  const imageUrls = exercise.images.map((p) => `${FED_BASE}/${p}`);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${exercise.name} proper form tutorial`,
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-ink-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-chalk-50">
              {exercise.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400">
              <span
                className="rounded px-1.5 py-0.5"
                style={{
                  color: LEVEL_COLOR[exercise.level],
                  background: `${LEVEL_COLOR[exercise.level]}20`,
                }}
              >
                {exercise.level}
              </span>
              {exercise.equipment && <span>· {exercise.equipment}</span>}
              {exercise.category && <span>· {exercise.category}</span>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-chalk-400 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="aspect-video w-full bg-black">
          {imageUrls.length > 0 ? (
            <FrameLoop
              images={imageUrls}
              alt={exercise.name}
              className="h-full w-full"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-chalk-500">
              <Dumbbell className="h-8 w-8" />
            </div>
          )}
        </div>

        <div className="overflow-y-auto px-4 py-3">
          {(exercise.primaryMuscles.length > 0 ||
            exercise.secondaryMuscles.length > 0) && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {exercise.primaryMuscles.map((m) => (
                <span
                  key={`p-${m}`}
                  className="rounded-full bg-accent-blue/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan"
                >
                  {m}
                </span>
              ))}
              {exercise.secondaryMuscles.map((m) => (
                <span
                  key={`s-${m}`}
                  className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400"
                >
                  {m}
                </span>
              ))}
            </div>
          )}

          {exercise.instructions.length > 0 && (
            <ol className="space-y-2 text-sm text-chalk-200">
              {exercise.instructions.map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-0.5 inline-grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent-blue/15 text-[10px] font-bold text-accent-cyan">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="border-t border-white/10 px-4 py-3">
          <a
            href={searchUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-chalk-300 hover:text-chalk-50"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Watch on YouTube
          </a>
        </div>
      </div>
    </div>
  );
}
