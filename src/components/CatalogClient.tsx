"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  Dumbbell,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

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

// Curated facet lists — `null`/missing equipment is mapped to "Bodyweight".
const MUSCLE_FACETS = [
  "chest",
  "shoulders",
  "lats",
  "middle back",
  "biceps",
  "triceps",
  "forearms",
  "abdominals",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
] as const;

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
  beginner: "#4ade80",
  intermediate: "#fbbf24",
  expert: "#f87171",
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
  const [muscle, setMuscle] = useState<string | null>(null);
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

  // Reset pagination whenever the result set changes
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, muscle, equipment, level]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    return all.filter((e) => {
      if (level && e.level !== level) return false;
      if (muscle && !e.primaryMuscles.includes(muscle)) return false;
      if (equipment && (e.equipment ?? "body only") !== equipment) return false;
      if (q) {
        const hay = `${e.name} ${e.primaryMuscles.join(" ")} ${e.equipment ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, muscle, equipment, level]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const activeFilterCount =
    (muscle ? 1 : 0) + (equipment ? 1 : 0) + (level ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="label-tiny">Exercise library</div>
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-chalk-50">
            Browse {all ? all.length : "…"} exercises
          </h1>
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

      {/* Search + filter toggle */}
      <div className="sticky top-[64px] z-10 -mx-4 border-b border-white/[0.05] bg-ink-950/85 px-4 py-3 backdrop-blur md:top-[68px]">
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
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition",
              activeFilterCount > 0
                ? "border-accent-cyan/50 bg-accent-cyan/10 text-accent-cyan"
                : "border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]",
            )}
          >
            Filters
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-accent-cyan/30 px-1.5 text-[10px]">
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
              label="Muscle"
              value={muscle}
              options={[...MUSCLE_FACETS]}
              onChange={setMuscle}
            />
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
                  setMuscle(null);
                  setEquipment(null);
                  setLevel(null);
                }}
                className="text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between text-xs text-chalk-400">
        <div>
          {all
            ? `${filtered.length} ${filtered.length === 1 ? "exercise" : "exercises"} match`
            : loadError
              ? `Failed to load catalog: ${loadError}`
              : "Loading catalog…"}
        </div>
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
              setMuscle(null);
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
                  ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan"
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
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] text-left transition hover:border-white/20 hover:bg-white/[0.05]"
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
                  className="rounded-full bg-accent-cyan/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-cyan"
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
                  <span className="mt-0.5 inline-grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[10px] font-bold text-chalk-300">
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
