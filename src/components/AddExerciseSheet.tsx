"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Dumbbell, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { addExerciseToDay } from "@/lib/actions/workout-plan";
import type { WorkoutMode } from "@/lib/types";

const FED_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// Equipment surfaces for Home mode — narrows the 873-item library to the
// subset that doesn't need a gym. Gym mode shows everything.
const HOME_EQUIPMENT = new Set([
  "body only",
  "dumbbell",
  "bands",
  "kettlebells",
]);

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

const MUSCLE_FACETS = [
  "chest",
  "shoulders",
  "lats",
  "middle back",
  "biceps",
  "triceps",
  "abdominals",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
] as const;

const LEVEL_FACETS: Level[] = ["beginner", "intermediate", "expert"];

const LEVEL_COLOR: Record<Level, string> = {
  beginner: "#4ade80",
  intermediate: "#fbbf24",
  expert: "#f87171",
};

const PAGE_SIZE = 30;

export function AddExerciseSheet({
  mode,
  dayIndex,
  dayLabel,
  dayColor,
  onClose,
}: {
  mode: WorkoutMode;
  dayIndex: number;
  dayLabel: string;
  dayColor: string;
  onClose: () => void;
}) {
  const [all, setAll] = useState<CatalogExercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [pending, start] = useTransition();
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/exercise-catalog.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CatalogExercise[]>;
      })
      .then((data) => {
        if (cancelled) return;
        const filtered =
          mode === "home"
            ? data.filter((e) =>
                HOME_EQUIPMENT.has(e.equipment ?? "body only"),
              )
            : data;
        setAll(filtered);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, muscle, level]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    return all.filter((e) => {
      if (level && e.level !== level) return false;
      if (muscle && !e.primaryMuscles.includes(muscle)) return false;
      if (q) {
        const hay = `${e.name} ${e.primaryMuscles.join(" ")} ${e.equipment ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, muscle, level]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  function handleAdd(ex: CatalogExercise) {
    setAdding(ex.id);
    start(async () => {
      try {
        await addExerciseToDay({
          mode,
          day_index: dayIndex,
          catalog_id: ex.id,
          name: ex.name,
          search_query: `${ex.name} proper form tutorial`,
          images: ex.images.map((p) => `${FED_BASE}/${p}`),
        });
        onClose();
      } finally {
        setAdding(null);
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-ink-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: `${dayColor}30` }}
        >
          <div className="min-w-0">
            <div
              className="text-[10px] font-bold uppercase tracking-[2px]"
              style={{ color: dayColor }}
            >
              Add to {dayLabel}
            </div>
            <div className="text-sm font-bold text-chalk-50">
              {mode === "home" ? "Home library" : "Full library"} ·{" "}
              {all ? `${all.length} exercises` : "loading…"}
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

        {/* Search + filters */}
        <div className="space-y-3 border-b border-white/[0.06] px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises"
              className="field pl-9"
              autoComplete="off"
              autoFocus
            />
          </div>
          <FacetRow
            label="Muscle"
            value={muscle}
            options={[...MUSCLE_FACETS]}
            onChange={setMuscle}
          />
          <FacetRow
            label="Level"
            value={level}
            options={[...LEVEL_FACETS]}
            onChange={(v) => setLevel(v as Level | null)}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3">
          {loadError ? (
            <div className="card-elev p-6 text-center text-sm text-accent-rose">
              Failed to load library: {loadError}
            </div>
          ) : !all ? (
            <div className="p-6 text-center text-sm text-chalk-400">
              Loading library…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-10 text-center">
              <Dumbbell className="h-6 w-6 text-chalk-400" />
              <div className="text-sm font-bold text-chalk-100">
                No exercises match those filters.
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setMuscle(null);
                  setLevel(null);
                }}
                className="text-xs font-bold text-accent-cyan"
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {slice.map((ex) => (
                <PickerCard
                  key={ex.id}
                  ex={ex}
                  onAdd={() => handleAdd(ex)}
                  busy={pending && adding === ex.id}
                  disabled={pending}
                />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-3">
              <button
                type="button"
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="btn-secondary"
                disabled={pending}
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visible)} more
              </button>
            </div>
          )}
        </div>
      </div>
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
      <div className="label-tiny mb-1">{label}</div>
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

function PickerCard({
  ex,
  onAdd,
  busy,
  disabled,
}: {
  ex: CatalogExercise;
  onAdd: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  const thumb = ex.images[0] ? `${FED_BASE}/${ex.images[0]}` : null;
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] text-left transition",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-accent-cyan/40 hover:bg-accent-cyan/[0.06]",
      )}
    >
      <div className="relative aspect-square w-full bg-ink-900">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-chalk-500">
            <Dumbbell className="h-5 w-5" />
          </div>
        )}
        <div
          className="absolute right-1 top-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            color: LEVEL_COLOR[ex.level],
            background: `${LEVEL_COLOR[ex.level]}25`,
          }}
        >
          {ex.level}
        </div>
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] font-bold uppercase tracking-wider text-accent-cyan">
            Adding…
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <div className="line-clamp-2 text-[11px] font-bold leading-snug text-chalk-50">
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
