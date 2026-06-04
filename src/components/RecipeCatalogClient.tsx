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
  LayoutGrid,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { RecipeHero } from "@/components/RecipeHero";
import { saveCatalogRecipe } from "@/lib/actions/recipes";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import {
  CATEGORIES,
  CATEGORY_BY_KEY,
  categoryFor,
  defaultMealType,
  parseIngredient,
  perServingMacros,
  type CatalogRecipe,
} from "@/lib/recipeCatalog";
import type { MealType } from "@/lib/types";

// Diet style — derived from tags + an ingredient sniff.
type DietStyle = "vegetarian" | "with-meat" | "vegan";
const DIET_FACETS: { key: DietStyle; label: string; emoji: string }[] = [
  { key: "vegetarian", label: "Vegetarian", emoji: "🌱" },
  { key: "vegan", label: "Vegan", emoji: "🥦" },
  { key: "with-meat", label: "With meat", emoji: "🥩" },
];

// Cuisine — sparse coverage in the dataset, but useful as a fine filter.
type Cuisine = "asian" | "mexican" | "korean" | "indian" | "greek" | "italian";
const CUISINE_FACETS: { key: Cuisine; label: string; flag: string }[] = [
  { key: "italian", label: "Italian", flag: "🇮🇹" },
  { key: "asian", label: "Asian", flag: "🥢" },
  { key: "mexican", label: "Mexican", flag: "🌶️" },
  { key: "korean", label: "Korean", flag: "🇰🇷" },
  { key: "indian", label: "Indian", flag: "🇮🇳" },
  { key: "greek", label: "Greek", flag: "🇬🇷" },
];

// Macro lean — derived from per-serving macros, dominant macro by % of kcal.
type MacroLean = "protein-rich" | "carb-rich" | "fat-rich";
const MACRO_FACETS: {
  key: MacroLean;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: "protein-rich", label: "Protein-rich", emoji: "💪", color: "#a78bfa" },
  { key: "carb-rich", label: "Carb-rich", emoji: "🍞", color: "#22d3ee" },
  { key: "fat-rich", label: "Fat-rich", emoji: "🥑", color: "#fbbf24" },
];

const MEALS: Array<MealType | "any"> = [
  "any",
  "breakfast",
  "snack",
  "lunch",
  "dinner",
];

const DAIRY_EGG_RX =
  /\b(milk|cheese|butter|yogurt|cream|egg|eggs|parmesan|mozzarella|feta|ricotta|ghee|honey|whey)\b/i;

function dietStylesFor(recipe: CatalogRecipe): DietStyle[] {
  const tagSet = new Set(recipe.tags.map((t) => t.toLowerCase()));
  const isVeg = tagSet.has("vegetarian");
  if (!isVeg) return ["with-meat"];
  const ingredientText = recipe.ingredients.join(" ");
  return DAIRY_EGG_RX.test(ingredientText)
    ? ["vegetarian"]
    : ["vegetarian", "vegan"];
}

const ITALIAN_NAME_RX =
  /\b(pasta|risotto|lasagna|carbonara|parmesan|bolognese|tiramisu|gnocchi|ravioli|focaccia|pesto|marinara|caprese)\b/i;

function cuisineFor(recipe: CatalogRecipe): Cuisine | null {
  const tagSet = new Set(recipe.tags.map((t) => t.toLowerCase()));
  if (tagSet.has("asian")) return "asian";
  if (tagSet.has("mexican")) return "mexican";
  if (tagSet.has("korean")) return "korean";
  if (tagSet.has("indian")) return "indian";
  if (tagSet.has("greek")) return "greek";
  if (tagSet.has("pasta") || ITALIAN_NAME_RX.test(recipe.name)) return "italian";
  return null;
}

function macroLeanFor(recipe: CatalogRecipe): MacroLean | null {
  const p = recipe.protein_g * 4;
  const c = recipe.carbs_g * 4;
  const f = recipe.fat_g * 9;
  const total = p + c + f;
  if (total < 50) return null;
  const pp = p / total;
  const cp = c / total;
  const fp = f / total;
  // Thresholds tuned against the 232-recipe catalog: protein checked first so
  // a high-protein dish that happens to be ~50% carbs still counts as
  // protein-rich rather than carb-rich.
  if (pp >= 0.25) return "protein-rich";
  if (fp >= 0.45) return "fat-rich";
  if (cp >= 0.55) return "carb-rich";
  return null;
}

const PAGE_SIZE = 24;

export function RecipeCatalogClient() {
  const [all, setAll] = useState<CatalogRecipe[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [diet, setDiet] = useState<DietStyle | null>(null);
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [macroLean, setMacroLean] = useState<MacroLean | null>(null);
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
  }, [query, category, diet, cuisine, macroLean, maxCals]);

  // Pre-derive facets per recipe so filtering + tile counts share the work.
  const annotated = useMemo(() => {
    if (!all) return null;
    return all.map((r) => ({
      r,
      category: categoryFor(r),
      diets: dietStylesFor(r),
      cuisine: cuisineFor(r),
      macroLean: macroLeanFor(r),
      kcalPerServing: Math.round(r.calories_total / Math.max(1, r.servings)),
    }));
  }, [all]);

  const categoryCounts = useMemo(() => {
    if (!annotated) return {} as Record<string, number>;
    const out: Record<string, number> = {};
    for (const a of annotated) {
      if (a.category) out[a.category] = (out[a.category] ?? 0) + 1;
    }
    return out;
  }, [annotated]);

  const filtered = useMemo(() => {
    if (!annotated) return [];
    const q = query.trim().toLowerCase();
    return annotated.filter((a) => {
      if (category && a.category !== category) return false;
      if (diet && !a.diets.includes(diet)) return false;
      if (cuisine && a.cuisine !== cuisine) return false;
      if (macroLean && a.macroLean !== macroLean) return false;
      if (maxCals !== null && a.kcalPerServing > maxCals) return false;
      if (q) {
        const hay =
          `${a.r.name} ${a.r.tags.join(" ")} ${a.r.ingredients.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [annotated, query, category, diet, cuisine, macroLean, maxCals]);

  const slice = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;
  const activeFilterCount =
    (diet ? 1 : 0) +
    (cuisine ? 1 : 0) +
    (macroLean ? 1 : 0) +
    (maxCals !== null ? 1 : 0);

  function resetAll() {
    setQuery("");
    setCategory(null);
    setDiet(null);
    setCuisine(null);
    setMacroLean(null);
    setMaxCals(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/diet/recipes"
          className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-ink-800 px-3 text-[13px] font-semibold text-chalk-200 transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-700 hover:text-white"
          aria-label="Back to saved recipes"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </div>
      <div>
        <div className="metric-label">Recipe library</div>
        <h1 className="display text-[28px] leading-tight text-white">
          Find your next meal
        </h1>
        <p className="mt-1 text-[13px] font-medium text-chalk-400">
          {all
            ? `${all.length} recipes · cuisine, diet style & macro lean`
            : loadError
              ? `Failed to load catalog: ${loadError}`
              : "Loading catalog…"}
        </p>
      </div>

      {/* Category tile browser */}
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        <button
          type="button"
          onClick={() => setCategory(null)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-all duration-200 ease-ios active:scale-[0.96]",
            category === null
              ? "bg-[#D9A441] text-black"
              : "bg-ink-800 text-chalk-200 hover:bg-ink-700",
          )}
        >
          <LayoutGrid className="h-[18px] w-[18px]" />
          <span className="text-[11px] font-bold uppercase tracking-wider">All</span>
          {all && (
            <span
              className="text-[10px] font-medium"
              style={{ opacity: category === null ? 0.7 : 0.6 }}
            >
              {all.length}
            </span>
          )}
        </button>
        {CATEGORIES.map((c) => {
          const sel = category === c.key;
          const count = categoryCounts[c.key] ?? 0;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(sel ? null : c.key)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition-all duration-200 ease-ios active:scale-[0.96]",
                sel ? "bg-[#D9A441] text-black" : "bg-ink-800 text-chalk-200 hover:bg-ink-700",
              )}
            >
              <span className="text-lg leading-none">{c.emoji}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">
                {c.label}
              </span>
              <span
                className="text-[10px] font-medium"
                style={{ opacity: sel ? 0.7 : 0.6 }}
              >
                {count}
              </span>
            </button>
          );
        })}
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
            <FacetRow
              label="Diet"
              value={diet}
              options={DIET_FACETS.map((f) => ({
                value: f.key,
                label: `${f.emoji} ${f.label}`,
              }))}
              onChange={(v) => setDiet(v as DietStyle | null)}
            />
            <FacetRow
              label="Cuisine"
              value={cuisine}
              options={CUISINE_FACETS.map((f) => ({
                value: f.key,
                label: `${f.flag} ${f.label}`,
              }))}
              onChange={(v) => setCuisine(v as Cuisine | null)}
            />
            <FacetRow
              label="Macro lean"
              value={macroLean}
              options={MACRO_FACETS.map((f) => ({
                value: f.key,
                label: `${f.emoji} ${f.label}`,
              }))}
              onChange={(v) => setMacroLean(v as MacroLean | null)}
            />
            <div>
              <div className="label-tiny mb-1.5">Calories / serving</div>
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
                  setDiet(null);
                  setCuisine(null);
                  setMacroLean(null);
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
          {annotated
            ? `${filtered.length} ${filtered.length === 1 ? "recipe" : "recipes"} match`
            : loadError
              ? `Failed to load catalog: ${loadError}`
              : "Loading catalog…"}
        </div>
      </div>

      {annotated && filtered.length === 0 ? (
        <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
          <ChefHat className="h-6 w-6 text-chalk-400" />
          <div className="text-sm font-bold text-chalk-100">
            No recipes match those filters.
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="text-xs font-bold text-accent-cyan"
          >
            Reset
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {slice.map((a) => (
            <RecipeGridCard
              key={a.r.id}
              recipe={a.r}
              category={a.category}
              cuisine={a.cuisine}
              macroLean={a.macroLean}
              kcalPerServing={a.kcalPerServing}
              onClick={() => setActive(a.r)}
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

      {active && (
        <RecipeDetail recipe={active} onClose={() => setActive(null)} />
      )}
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
  options: { value: string; label: string }[];
  onChange: (v: string | null) => void;
}) {
  return (
    <div>
      <div className="label-tiny mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const sel = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(sel ? null : o.value)}
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
  );
}

function RecipeGridCard({
  recipe,
  category,
  cuisine,
  macroLean,
  kcalPerServing,
  onClick,
}: {
  recipe: CatalogRecipe;
  category: string | null;
  cuisine: Cuisine | null;
  macroLean: MacroLean | null;
  kcalPerServing: number;
  onClick: () => void;
}) {
  const ps = perServingMacros(recipe);
  const cat = category ? CATEGORY_BY_KEY.get(category) : null;
  const cuisineMeta = cuisine
    ? CUISINE_FACETS.find((c) => c.key === cuisine)
    : null;
  const macroMeta = macroLean
    ? MACRO_FACETS.find((m) => m.key === macroLean)
    : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-ink-850 text-left shadow-bento transition-all duration-200 ease-ios active:scale-[0.98] hover:bg-ink-800"
    >
      {/* Visual header — Pexels photo when matched, else gradient + emoji */}
      <RecipeHero
        image={recipe.image}
        query={recipe.name}
        emoji={cat?.emoji ?? "🍴"}
        gradient={cat?.gradient ?? "from-ink-700/50 to-ink-900/0"}
        className="aspect-[5/3]"
        emojiClassName="text-4xl"
      >
        <div className="absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-accent-amber backdrop-blur-sm">
          {kcalPerServing} cal
        </div>
        {cuisineMeta && (
          <div className="absolute right-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-chalk-100 backdrop-blur-sm">
            {cuisineMeta.flag} {cuisineMeta.label}
          </div>
        )}
        {macroMeta && (
          <div
            className="absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold backdrop-blur-sm"
            style={{
              background: `${macroMeta.color}22`,
              color: macroMeta.color,
            }}
          >
            {macroMeta.emoji} {macroMeta.label}
          </div>
        )}
        {recipe.total_minutes > 0 && (
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-chalk-200 backdrop-blur-sm">
            <Clock className="h-2.5 w-2.5" />
            {recipe.total_minutes}m
          </div>
        )}
      </RecipeHero>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="line-clamp-2 text-sm font-bold leading-snug text-chalk-50">
          {recipe.name}
        </div>
        <div className="mt-auto grid grid-cols-3 gap-1.5 text-center">
          <Macro label="P" v={`${ps.p}g`} color="#a78bfa" />
          <Macro label="C" v={`${ps.c}g`} color="#22d3ee" />
          <Macro label="F" v={`${ps.f}g`} color="#fbbf24" />
        </div>
      </div>
    </button>
  );
}

function Macro({
  label,
  v,
  color,
}: {
  label: string;
  v: string;
  color: string;
}) {
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
  const cat = categoryFor(recipe);
  const catMeta = cat ? CATEGORY_BY_KEY.get(cat) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useBodyScrollLock();

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
        className="flex max-h-[90svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-ink-850 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Visual hero strip — Pexels photo when matched, else gradient + emoji */}
        <RecipeHero
          image={recipe.image}
          query={recipe.name}
          emoji={catMeta?.emoji ?? "🍴"}
          gradient={catMeta?.gradient ?? "from-ink-700/50 to-ink-900/0"}
          className="aspect-[16/7]"
          emojiClassName="text-6xl"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg bg-black/40 p-1.5 text-chalk-100 backdrop-blur-sm hover:bg-black/60"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </RecipeHero>

        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <div className="text-sm font-bold leading-snug text-chalk-50">
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
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-white/[0.06] px-4 py-3">
          <Macro label="Protein" v={`${ps.p}g`} color="#a78bfa" />
          <Macro label="Carbs" v={`${ps.c}g`} color="#22d3ee" />
          <Macro label="Fat" v={`${ps.f}g`} color="#fbbf24" />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
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
