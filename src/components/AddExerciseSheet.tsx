"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ChevronDown, Dumbbell, LayoutGrid, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addExerciseToDay,
  replaceExerciseInDay,
} from "@/lib/actions/workout-plan";
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

type MuscleGroup = {
  key: string;
  label: string;
  emoji: string;
  gradient: string;
  matches: string[];
};

// Mirrors the catalog page's tile browser so the picker feels identical.
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
    matches: [],
  },
];

// Map a single primary-muscle string to its containing group, used when the
// day-focus chips are derived from individual muscles.
function groupFromMuscle(m: string): string | null {
  for (const g of MUSCLE_GROUPS) {
    if (g.matches.includes(m)) return g.key;
  }
  return null;
}

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

const PAGE_SIZE = 30;

export function AddExerciseSheet({
  mode,
  dayIndex,
  dayLabel,
  dayColor,
  focusMuscles = [],
  focusCategory,
  replaceTarget,
  onClose,
}: {
  mode: WorkoutMode;
  dayIndex: number;
  dayLabel: string;
  dayColor: string;
  focusMuscles?: string[];
  focusCategory?: string;
  replaceTarget?: { position: number; name: string };
  onClose: () => void;
}) {
  const [all, setAll] = useState<CatalogExercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // Default group derived from the day's primary focus muscle, if any.
  const initialGroup =
    focusCategory === "cardio" || focusCategory === "stretching"
      ? "full"
      : focusMuscles[0]
        ? groupFromMuscle(focusMuscles[0])
        : null;
  const [group, setGroup] = useState<string | null>(initialGroup);
  const [equipment, setEquipment] = useState<string | null>(null);
  const [level, setLevel] = useState<Level | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  }, [query, group, equipment, level]);

  const groupCounts = useMemo(() => {
    if (!all) return {} as Record<string, number>;
    const out: Record<string, number> = {};
    for (const g of MUSCLE_GROUPS) {
      if (g.key === "full") {
        out[g.key] = all.filter(
          (e) =>
            (e.category ?? "") === "cardio" ||
            (e.category ?? "") === "stretching",
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
          if (
            (e.category ?? "") !== "cardio" &&
            (e.category ?? "") !== "stretching"
          ) {
            return false;
          }
        } else if (
          !e.primaryMuscles.some((m) => activeGroup.matches.includes(m))
        ) {
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

  function handleAdd(ex: CatalogExercise) {
    setAdding(ex.id);
    start(async () => {
      try {
        const payload = {
          mode,
          day_index: dayIndex,
          catalog_id: ex.id,
          name: ex.name,
          search_query: `${ex.name} proper form tutorial`,
          images: ex.images.map((p) => `${FED_BASE}/${p}`),
        };
        if (replaceTarget) {
          await replaceExerciseInDay({
            ...payload,
            position: replaceTarget.position,
          });
        } else {
          await addExerciseToDay(payload);
        }
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
        className="flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-ink-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — day-colored ribbon */}
        <div
          className="relative flex items-center justify-between gap-3 border-b px-4 py-3"
          style={{ borderColor: `${dayColor}30` }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: dayColor }}
          />
          <div className="min-w-0">
            <div
              className="text-[10px] font-bold uppercase tracking-[2px]"
              style={{ color: dayColor }}
            >
              {replaceTarget
                ? `Replace ${replaceTarget.name}`
                : `Add to ${dayLabel}`}
            </div>
            <div className="text-sm font-bold text-chalk-50">
              {mode === "home" ? "Home library" : "Full library"} ·{" "}
              {all ? `${all.length} exercises` : "loading…"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-chalk-400 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Muscle group tile browser */}
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
            <button
              type="button"
              onClick={() => setGroup(null)}
              className={cn(
                "group/tile relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border p-2 text-center transition-all",
                group === null
                  ? "border-accent-blue/50 bg-accent-blue/10 shadow-glow"
                  : "border-white/[0.08] bg-white/[0.025] hover:border-white/20",
              )}
            >
              <LayoutGrid
                className={cn(
                  "h-4 w-4",
                  group === null ? "text-accent-cyan" : "text-chalk-400",
                )}
              />
              <div
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  group === null ? "text-accent-cyan" : "text-chalk-200",
                )}
              >
                All
              </div>
            </button>
            {MUSCLE_GROUPS.map((g) => {
              const sel = group === g.key;
              const count = groupCounts[g.key] ?? 0;
              return (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGroup(sel ? null : g.key)}
                  className={cn(
                    "group/tile relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border p-2 text-center transition-all",
                    sel
                      ? "border-accent-blue/50 shadow-glow"
                      : "border-white/[0.08] hover:border-white/20",
                  )}
                >
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-50",
                      g.gradient,
                      !sel && "opacity-25 group-hover/tile:opacity-50",
                    )}
                  />
                  <div
                    className={cn(
                      "absolute inset-0",
                      sel ? "bg-accent-blue/10" : "bg-white/[0.02]",
                    )}
                  />
                  <span className="relative text-base leading-none">
                    {g.emoji}
                  </span>
                  <div
                    className={cn(
                      "relative text-[10px] font-bold uppercase tracking-wider",
                      sel ? "text-accent-cyan" : "text-chalk-100",
                    )}
                  >
                    {g.label}
                  </div>
                  <div className="relative text-[9px] text-chalk-400">
                    {count}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + filters disclosure */}
        <div className="border-b border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
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
        "group flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.025] text-left transition-all",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:-translate-y-0.5 hover:border-accent-blue/40 hover:shadow-glow",
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
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
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
          <div className="absolute inset-0 grid place-items-center bg-black/60 text-[10px] font-bold uppercase tracking-wider text-accent-cyan">
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
