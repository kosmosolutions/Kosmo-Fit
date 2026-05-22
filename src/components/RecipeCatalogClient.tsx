"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookmarkPlus,
  ChefHat,
  ChevronDown,
  Clock,
  ExternalLink,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { saveCatalogRecipe } from "@/lib/actions/recipes";
import type { MealType } from "@/lib/types";

interface CatalogRecipe {
  id: string;
  name: string;
  source: string | null;
  servings: number;
  calories_total: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  total_minutes: number;
  instructions: string;
  ingredients: string[];
  tags: string[];
}

// Curated set of facet tags surfaced as filter chips. The dataset has many
// long-tail tags ("untried", "components" etc.) we hide to keep the UI tight.
const TAG_FACETS = [
  "main",
  "breakfast",
  "dessert",
  "salad",
  "soup",
  "sides",
  "appetizer",
  "pasta",
  "seafood",
  "drink",
  "vegetarian",
  "sandwich",
] as const;

const MEALS: Array<MealType | "any"> = [
  "any",
  "breakfast",
  "snack",
  "lunch",
  "dinner",
];

// Auto-suggest a meal_type from tags. User can override before saving.
function defaultMealType(tags: string[]): MealType | "any" {
  const t = new Set(tags);
  if (t.has("breakfast")) return "breakfast";
  if (t.has("dessert") || t.has("drink") || t.has("appetizer")) return "snack";
  if (t.has("soup") || t.has("salad") || t.has("sandwich")) return "lunch";
  if (t.has("main") || t.has("pasta") || t.has("seafood")) return "dinner";
  return "any";
}

const PAGE_SIZE = 24;

export function RecipeCatalogClient() {
  const [all, setAll] = useState<CatalogRecipe[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [maxCals, setMaxCals] = useState<number | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [active, setActive] = useState<CatalogRecipe | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/recipe-catalog.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CatalogRecipe[]>;
      })
      .then((d) => {
        if (!cancelled) setAll(d);
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
  }, [query, tag, maxCals]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = query.trim().toLowerCase();
    return all.filter((r) => {
      if (tag && !r.tags.includes(tag)) return false;
      if (
        maxCals !== null &&
        Math.round(r.calories_total / Math.max(1, r.servings)) > maxCals
      ) {
        return false;
      }
      if (q) {
        const hay = `${r.name} ${r.tags.join(" ")} ${r.ingredients.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, query, tag, maxCals]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const activeFilterCount = (tag ? 1 : 0) + (maxCals !== null ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="label-tiny">Recipe library</div>
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-chalk-50">
            Browse {all ? all.length : "…"} recipes
          </h1>
        </div>
        <Link
          href="/diet/recipes"
          className="btn-secondary shrink-0"
          aria-label="Back to saved recipes"
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
              placeholder="Search by name, ingredient or tag"
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
            <div>
              <div className="label-tiny mb-1.5">Tag</div>
              <div className="flex flex-wrap gap-1.5">
                {TAG_FACETS.map((t) => {
                  const sel = tag === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(sel ? null : t)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-bold capitalize transition",
                        sel
                          ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan"
                          : "border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]",
                      )}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="label-tiny mb-1.5">Calories per serving</div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { v: 300, label: "≤ 300" },
                    { v: 500, label: "≤ 500" },
                    { v: 800, label: "≤ 800" },
                  ] as const
                ).map((o) => {
                  const sel = maxCals === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setMaxCals(sel ? null : o.v)}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                        sel
                          ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan"
                          : "border-white/10 bg-white/[0.04] text-chalk-300 hover:bg-white/[0.08]",
                      )}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTag(null);
                  setMaxCals(null);
                }}
                className="text-xs font-bold text-chalk-400 hover:text-chalk-100"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-chalk-400">
        <div>
          {all
            ? `${filtered.length} ${filtered.length === 1 ? "recipe" : "recipes"} match`
            : loadError
              ? `Failed to load catalog: ${loadError}`
              : "Loading catalog…"}
        </div>
      </div>

      {all && filtered.length === 0 ? (
        <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
          <ChefHat className="h-6 w-6 text-chalk-400" />
          <div className="text-sm font-bold text-chalk-100">
            No recipes match those filters.
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setTag(null);
              setMaxCals(null);
            }}
            className="text-xs font-bold text-accent-cyan"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((r) => (
            <RecipeGridCard key={r.id} r={r} onClick={() => setActive(r)} />
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

      {active && (
        <RecipeDetail recipe={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
}

function perServingMacros(r: CatalogRecipe) {
  const s = Math.max(1, r.servings || 1);
  return {
    kcal: Math.round(r.calories_total / s),
    p: Math.round(r.protein_g / s),
    c: Math.round(r.carbs_g / s),
    f: Math.round(r.fat_g / s),
  };
}

function RecipeGridCard({
  r,
  onClick,
}: {
  r: CatalogRecipe;
  onClick: () => void;
}) {
  const ps = perServingMacros(r);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-bold leading-snug text-chalk-50">
          {r.name}
        </div>
        <div
          className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold text-accent-amber"
          style={{ background: "rgba(251,191,36,0.12)" }}
        >
          {ps.kcal} cal
        </div>
      </div>
      <div className="flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-wider text-chalk-400">
        {r.tags.slice(0, 3).map((t) => (
          <span key={t}>{t}</span>
        ))}
        {r.servings > 1 && <span>· {r.servings} servings</span>}
      </div>
      <div className="mt-auto grid grid-cols-3 gap-1.5 pt-1 text-center">
        <Macro label="P" v={`${ps.p}g`} color="#a78bfa" />
        <Macro label="C" v={`${ps.c}g`} color="#22d3ee" />
        <Macro label="F" v={`${ps.f}g`} color="#fbbf24" />
      </div>
    </button>
  );
}

function Macro({ label, v, color }: { label: string; v: string; color: string }) {
  return (
    <div
      className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-1.5 py-1"
      style={{ borderColor: `${color}22` }}
    >
      <div className="text-[9px] uppercase tracking-wider text-chalk-400">
        {label}
      </div>
      <div className="text-[11px] font-extrabold" style={{ color }}>
        {v}
      </div>
    </div>
  );
}

function RecipeDetail({
  recipe,
  onClose,
}: {
  recipe: CatalogRecipe;
  onClose: () => void;
}) {
  const [meal, setMeal] = useState<MealType | "any">(
    defaultMealType(recipe.tags),
  );
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const ps = perServingMacros(recipe);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    if (pending || saved) return;
    start(async () => {
      await saveCatalogRecipe({
        name: recipe.name,
        source: recipe.source ?? null,
        servings: recipe.servings,
        calories_total: recipe.calories_total,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients.map((line) => parseIngredient(line)),
        meal_type: meal,
      });
      setSaved(true);
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
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-chalk-50">
              {recipe.name}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400">
              <span className="rounded bg-accent-amber/15 px-1.5 py-0.5 text-accent-amber">
                {ps.kcal} cal/serving
              </span>
              <span>· {recipe.servings} servings</span>
              {recipe.total_minutes > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" /> {recipe.total_minutes} min
                </span>
              )}
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

        <div className="grid grid-cols-3 gap-2 border-b border-white/[0.06] px-4 py-3">
          <Macro label="Protein" v={`${ps.p}g`} color="#a78bfa" />
          <Macro label="Carbs" v={`${ps.c}g`} color="#22d3ee" />
          <Macro label="Fat" v={`${ps.f}g`} color="#fbbf24" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {recipe.ingredients.length > 0 && (
            <section>
              <div className="label-tiny mb-2">Ingredients</div>
              <ul className="space-y-1 text-sm text-chalk-200">
                {recipe.ingredients.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-chalk-500">·</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recipe.instructions && (
            <section>
              <div className="label-tiny mb-2">Instructions</div>
              <div className="whitespace-pre-line text-sm leading-relaxed text-chalk-200">
                {recipe.instructions}
              </div>
            </section>
          )}

          {recipe.source && (
            <a
              href={
                recipe.source.startsWith("http")
                  ? recipe.source
                  : `https://www.google.com/search?q=${encodeURIComponent(recipe.source)}`
              }
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
            >
              <ExternalLink className="h-3 w-3" /> Source: {recipe.source}
            </a>
          )}
        </div>

        <div className="space-y-2 border-t border-white/10 px-4 py-3">
          <div>
            <div className="label-tiny mb-1.5">Best for</div>
            <div className="flex flex-wrap gap-1.5">
              {MEALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMeal(m)}
                  disabled={saved}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-bold capitalize transition",
                    meal === m
                      ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan"
                      : "border-white/10 bg-white/[0.04] text-chalk-300",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending || saved}
            className={cn(
              "btn-primary w-full py-2.5",
              saved && "!bg-accent-green !text-ink-950",
            )}
          >
            {saved ? (
              "Saved ✓"
            ) : pending ? (
              "Saving…"
            ) : (
              <>
                <BookmarkPlus className="h-4 w-4" /> Save to my recipes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Split a single ingredient line like "1/2 cup oats" into {amount, name}.
// First two whitespace-separated tokens are treated as the amount when the
// leading token starts with a digit or a vulgar-fraction character.
function parseIngredient(line: string): { name: string; amount?: string } {
  const trimmed = line.trim();
  if (!trimmed) return { name: "" };
  const m = trimmed.match(
    /^(\d[\d./\s-]*\s?(?:cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|tbsp|tsp|oz|ounce|ounces|pound|pounds|lb|lbs|gram|grams|g|kg|ml|l|liter|liters|clove|cloves|slice|slices|piece|pieces|can|cans|stick|sticks)?)\s+(.+)$/i,
  );
  if (m) {
    return { amount: m[1].trim(), name: m[2].trim() };
  }
  return { name: trimmed };
}
