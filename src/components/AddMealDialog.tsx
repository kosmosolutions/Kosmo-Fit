"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Barcode,
  BookmarkPlus,
  ChefHat,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { addFoodEntry } from "@/lib/actions/entries";
import { saveCatalogRecipe } from "@/lib/actions/recipes";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { RecipeHero } from "@/components/RecipeHero";
import {
  lookupBarcode,
  searchFoods,
  type FoodItem,
  type FoodUnit,
} from "@/lib/foods";
import {
  CATEGORY_BY_KEY,
  categoryFor,
  defaultMealType,
  parseIngredient,
  type CatalogRecipe,
} from "@/lib/recipeCatalog";
import type { MealType, Recipe } from "@/lib/types";

// Lazy-load the scanner: @zxing/library is ~100 kB gzipped, only needed when
// the user actually taps the barcode button. Keeps the diet route's first-load
// bundle small.
const BarcodeScanner = dynamic(
  () => import("./BarcodeScanner").then((m) => m.BarcodeScanner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 p-10 text-xs text-chalk-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading scanner…
      </div>
    ),
  },
);

const MEALS: MealType[] = ["breakfast", "snack", "lunch", "dinner"];
const RECIPE_SEARCH_LIMIT = 30;
const FOOD_SEARCH_DEBOUNCE_MS = 350;

type Tab = "foods" | "recipes" | "new" | "saved";

export function AddMealDialog({
  entryDate,
  recipes,
  defaultMeal,
  triggerClassName,
  triggerLabel,
  triggerVariant = "chip",
}: {
  entryDate: string;
  recipes: Recipe[];
  defaultMeal?: MealType;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: "chip" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("foods");
  const [pending, start] = useTransition();
  useBodyScrollLock(open);

  // --- Recipes tab state (bundled catalog) ---
  const [catalog, setCatalog] = useState<CatalogRecipe[] | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [pickedCatalog, setPickedCatalog] = useState<CatalogRecipe | null>(null);

  // --- Foods tab state (OpenFoodFacts) ---
  const [foodQuery, setFoodQuery] = useState("");
  const [foodResults, setFoodResults] = useState<FoodItem[]>([]);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodError, setFoodError] = useState<string | null>(null);
  const [pickedFood, setPickedFood] = useState<FoodItem | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanLookupError, setScanLookupError] = useState<string | null>(null);

  // --- Quick-entry form state ---
  const [form, setForm] = useState({
    meal_type: defaultMeal ?? ("breakfast" as MealType),
    name: "",
    servings: 1,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });

  // Reset transient state when the dialog closes so re-opens start fresh.
  useEffect(() => {
    if (!open) {
      setPickedCatalog(null);
      setPickedFood(null);
      setScanning(false);
      setScanLookupError(null);
    }
  }, [open]);

  // Escape collapses one layer at a time: scanner → detail → list → close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (scanning) setScanning(false);
      else if (pickedFood) setPickedFood(null);
      else if (pickedCatalog) setPickedCatalog(null);
      else setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, pickedCatalog, pickedFood, scanning]);

  // Lazy-load the bundled recipe catalog the first time Recipes is visited.
  useEffect(() => {
    if (!open || tab !== "recipes" || catalog !== null || catalogError) return;
    let cancelled = false;
    fetch("/recipe-catalog.json", { cache: "force-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<CatalogRecipe[]>;
      })
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) setCatalogError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [open, tab, catalog, catalogError]);

  const recipeResults = useMemo(() => {
    if (!catalog) return [];
    const q = catalogQuery.trim().toLowerCase();
    if (!q) return catalog.slice(0, RECIPE_SEARCH_LIMIT);
    return catalog
      .filter((r) =>
        `${r.name} ${r.tags.join(" ")} ${r.ingredients.join(" ")}`
          .toLowerCase()
          .includes(q),
      )
      .slice(0, RECIPE_SEARCH_LIMIT);
  }, [catalog, catalogQuery]);

  // Debounced OpenFoodFacts search. Aborts any in-flight request when the
  // query changes so older responses can't clobber newer state.
  const foodAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!open || tab !== "foods" || pickedFood || scanning) return;
    const q = foodQuery.trim();
    if (q.length < 2) {
      setFoodResults([]);
      setFoodLoading(false);
      setFoodError(null);
      return;
    }
    const timer = setTimeout(() => {
      foodAbortRef.current?.abort();
      const controller = new AbortController();
      foodAbortRef.current = controller;
      setFoodLoading(true);
      setFoodError(null);
      searchFoods(q, controller.signal)
        .then((foods) => {
          if (controller.signal.aborted) return;
          setFoodResults(foods);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          if (err instanceof Error && err.name === "AbortError") return;
          setFoodError(String(err));
        })
        .finally(() => {
          if (controller.signal.aborted) return;
          setFoodLoading(false);
        });
    }, FOOD_SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [foodQuery, open, tab, pickedFood, scanning]);

  // Cleanup the abort controller on unmount.
  useEffect(
    () => () => {
      foodAbortRef.current?.abort();
    },
    [],
  );

  function submitNew() {
    if (!form.name.trim()) return;
    start(async () => {
      await addFoodEntry({
        entry_date: entryDate,
        meal_type: form.meal_type,
        name: form.name.trim(),
        servings: form.servings,
        calories: form.calories,
        protein_g: form.protein_g,
        carbs_g: form.carbs_g,
        fat_g: form.fat_g,
      });
      setOpen(false);
      setForm({
        ...form,
        name: "",
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
      });
    });
  }

  function submitRecipe(recipe: Recipe, servings: number) {
    start(async () => {
      await addFoodEntry({
        entry_date: entryDate,
        meal_type: form.meal_type,
        name: recipe.name,
        servings,
        calories: Math.round(recipe.calories_per_serving * servings),
        protein_g: Math.round(recipe.protein_g * servings),
        carbs_g: Math.round(recipe.carbs_g * servings),
        fat_g: Math.round(recipe.fat_g * servings),
        recipe_id: recipe.id,
      });
      setOpen(false);
    });
  }

  function submitCatalogRecipe(recipe: CatalogRecipe, servings: number) {
    const perServing = 1 / Math.max(1, recipe.servings);
    start(async () => {
      await addFoodEntry({
        entry_date: entryDate,
        meal_type: form.meal_type,
        name: recipe.name,
        servings,
        calories: Math.round(recipe.calories_total * perServing * servings),
        protein_g: Math.round(recipe.protein_g * perServing * servings),
        carbs_g: Math.round(recipe.carbs_g * perServing * servings),
        fat_g: Math.round(recipe.fat_g * perServing * servings),
      });
      setOpen(false);
    });
  }

  function submitFood(food: FoodItem, unit: FoodUnit, quantity: number) {
    const displayName = food.brand
      ? `${food.brand} — ${food.name}`
      : food.name;
    start(async () => {
      await addFoodEntry({
        entry_date: entryDate,
        meal_type: form.meal_type,
        name: displayName,
        servings: quantity,
        calories: Math.round(unit.kcal * quantity),
        protein_g: Math.round(unit.protein * quantity),
        carbs_g: Math.round(unit.carbs * quantity),
        fat_g: Math.round(unit.fat * quantity),
      });
      setOpen(false);
    });
  }

  async function handleBarcodeDetected(barcode: string) {
    setScanning(false);
    setScanLookupError(null);
    try {
      const product = await lookupBarcode(barcode);
      if (!product) {
        setScanLookupError(
          `No food found for barcode ${barcode}. Try searching by name.`,
        );
        return;
      }
      setPickedFood(product);
    } catch (e) {
      setScanLookupError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (defaultMeal) setForm({ ...form, meal_type: defaultMeal });
          setOpen(true);
        }}
        className={cn(
          triggerVariant === "primary"
            ? "btn-primary w-full py-3 text-sm"
            : "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-chalk-200 hover:bg-white/10",
          triggerClassName,
        )}
      >
        <Plus className={cn(triggerVariant === "primary" ? "h-4 w-4" : "h-3.5 w-3.5")} />{" "}
        {triggerLabel ?? "Add"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-stretch justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex h-full w-full flex-col overflow-hidden border-white/10 bg-ink-900 sm:h-auto sm:max-h-[88svh] sm:max-w-md sm:rounded-3xl sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed header: title, meal target, tabs */}
            <div className="shrink-0 border-b border-white/10 p-5 pb-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-extrabold text-chalk-50">
                Log a meal
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-chalk-400 hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-3 grid grid-cols-4 gap-1">
              {MEALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setForm({ ...form, meal_type: m })}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] font-bold capitalize transition",
                    form.meal_type === m
                      ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan"
                      : "border-white/10 bg-white/[0.03] text-chalk-300",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <TabButton
                active={tab === "foods"}
                onClick={() => {
                  setTab("foods");
                  setPickedCatalog(null);
                }}
              >
                <Search className="h-3 w-3" /> Foods
              </TabButton>
              <TabButton
                active={tab === "recipes"}
                onClick={() => {
                  setTab("recipes");
                  setPickedFood(null);
                  setScanning(false);
                }}
              >
                Recipes
              </TabButton>
              <TabButton
                active={tab === "new"}
                onClick={() => {
                  setTab("new");
                  setPickedCatalog(null);
                  setPickedFood(null);
                  setScanning(false);
                }}
              >
                Quick
              </TabButton>
              <TabButton
                active={tab === "saved"}
                onClick={() => {
                  setTab("saved");
                  setPickedCatalog(null);
                  setPickedFood(null);
                  setScanning(false);
                }}
              >
                Saved ({recipes.length})
              </TabButton>
            </div>
            </div>

            {/* Scrollable body — keeps inputs reachable above the mobile
                keyboard; the browser scrolls a focused field into view here. */}
            <div className="flex-1 overflow-y-auto p-5 pt-4">
            {/* ----- Foods tab ----- */}
            {tab === "foods" && scanning ? (
              <BarcodeScanner
                onDetect={handleBarcodeDetected}
                onCancel={() => setScanning(false)}
              />
            ) : tab === "foods" && pickedFood ? (
              <FoodDetail
                food={pickedFood}
                onBack={() => setPickedFood(null)}
                onLog={(unit, qty) => submitFood(pickedFood, unit, qty)}
                disabled={pending}
              />
            ) : tab === "foods" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400" />
                    <input
                      type="search"
                      value={foodQuery}
                      onChange={(e) => setFoodQuery(e.target.value)}
                      placeholder="Search foods (e.g. Cheerios, banana)"
                      className="field pl-9"
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setScanLookupError(null);
                      setScanning(true);
                    }}
                    className="rounded-xl border border-accent-cyan/40 bg-accent-cyan/10 p-2.5 text-accent-cyan transition hover:bg-accent-cyan/20"
                    aria-label="Scan barcode"
                  >
                    <Barcode className="h-4 w-4" />
                  </button>
                </div>
                {scanLookupError && (
                  <div className="rounded-xl border border-dashed border-accent-rose/40 p-3 text-center text-xs text-accent-rose">
                    {scanLookupError}
                  </div>
                )}
                <div className="space-y-2">
                  {foodError ? (
                    <div className="rounded-xl border border-dashed border-accent-rose/40 p-6 text-center text-xs text-accent-rose">
                      {foodError}
                    </div>
                  ) : foodQuery.trim().length < 2 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                      <Search className="mx-auto h-5 w-5 text-chalk-400" />
                      <div className="mt-2 text-sm text-chalk-300">
                        Search whole foods + ingredients, or scan a packaged
                        barcode.
                      </div>
                      <div className="mt-0.5 text-[11px] text-chalk-500">
                        USDA FoodData Central · OpenFoodFacts barcodes
                      </div>
                    </div>
                  ) : foodLoading ? (
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-6 text-xs text-chalk-400">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                    </div>
                  ) : foodResults.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-chalk-400">
                      No foods found for &ldquo;{foodQuery}&rdquo;.
                    </div>
                  ) : (
                    foodResults.map((f) => (
                      <FoodResultRow
                        key={f.id}
                        food={f}
                        onSelect={() => setPickedFood(f)}
                      />
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* ----- Recipes tab ----- */}
            {tab === "recipes" && pickedCatalog ? (
              <CatalogDetail
                recipe={pickedCatalog}
                onBack={() => setPickedCatalog(null)}
                onLog={(s) => submitCatalogRecipe(pickedCatalog, s)}
                disabled={pending}
              />
            ) : tab === "recipes" ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-chalk-400" />
                  <input
                    type="search"
                    value={catalogQuery}
                    onChange={(e) => setCatalogQuery(e.target.value)}
                    placeholder={
                      catalog
                        ? `Search ${catalog.length} catalog recipes`
                        : "Search catalog recipes"
                    }
                    className="field pl-9"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  {catalogError ? (
                    <div className="rounded-xl border border-dashed border-accent-rose/40 p-6 text-center text-xs text-accent-rose">
                      Failed to load catalog: {catalogError}
                    </div>
                  ) : !catalog ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-chalk-400">
                      Loading catalog…
                    </div>
                  ) : recipeResults.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                      <ChefHat className="mx-auto h-5 w-5 text-chalk-400" />
                      <div className="mt-2 text-sm text-chalk-300">
                        No catalog recipes match.
                      </div>
                    </div>
                  ) : (
                    recipeResults.map((r) => (
                      <CatalogResultRow
                        key={r.id}
                        recipe={r}
                        onSelect={() => setPickedCatalog(r)}
                      />
                    ))
                  )}
                </div>
              </div>
            ) : null}

            {/* ----- Quick entry tab ----- */}
            {tab === "new" && (
              <div className="space-y-3">
                <label className="block">
                  <span className="label-tiny">Name</span>
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Chicken bowl"
                    className="field mt-1"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <NumberInput
                    label="Calories"
                    unit="cal"
                    value={form.calories}
                    onChange={(v) => setForm({ ...form, calories: v })}
                  />
                  <NumberInput
                    label="Servings"
                    unit="×"
                    step={0.25}
                    value={form.servings}
                    onChange={(v) => setForm({ ...form, servings: v || 1 })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <NumberInput
                    label="Protein"
                    unit="g"
                    value={form.protein_g}
                    onChange={(v) => setForm({ ...form, protein_g: v })}
                  />
                  <NumberInput
                    label="Carbs"
                    unit="g"
                    value={form.carbs_g}
                    onChange={(v) => setForm({ ...form, carbs_g: v })}
                  />
                  <NumberInput
                    label="Fat"
                    unit="g"
                    value={form.fat_g}
                    onChange={(v) => setForm({ ...form, fat_g: v })}
                  />
                </div>
                <button
                  type="button"
                  disabled={pending || !form.name.trim()}
                  onClick={submitNew}
                  className="btn-primary w-full py-3"
                >
                  {pending ? "Logging…" : "Log meal"}
                </button>
              </div>
            )}

            {/* ----- Saved recipes tab ----- */}
            {tab === "saved" && (
              <div className="space-y-2">
                {recipes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <ChefHat className="mx-auto h-5 w-5 text-chalk-400" />
                    <div className="mt-2 text-sm text-chalk-300">
                      No recipes saved yet.
                    </div>
                  </div>
                ) : (
                  recipes.map((r) => (
                    <RecipePick
                      key={r.id}
                      recipe={r}
                      onUse={(s) => submitRecipe(r, s)}
                      disabled={pending}
                    />
                  ))
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NumberInput({
  label,
  unit,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <label className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2">
      <span className="label-tiny">{label}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border-none bg-transparent p-0 text-lg font-extrabold text-chalk-50 outline-none"
        />
        <span className="text-[10px] text-chalk-400">{unit}</span>
      </span>
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1 rounded-lg px-1 py-1.5 text-[11px] font-bold transition",
        active ? "bg-white/[0.08] text-chalk-50" : "text-chalk-300",
      )}
    >
      {children}
    </button>
  );
}

function CatalogResultRow({
  recipe,
  onSelect,
}: {
  recipe: CatalogRecipe;
  onSelect: () => void;
}) {
  const perServing = 1 / Math.max(1, recipe.servings);
  const kcal = Math.round(recipe.calories_total * perServing);
  const p = Math.round(recipe.protein_g * perServing);
  const c = Math.round(recipe.carbs_g * perServing);
  const f = Math.round(recipe.fat_g * perServing);
  const cat = categoryFor(recipe);
  const catMeta = cat ? CATEGORY_BY_KEY.get(cat) : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition hover:border-accent-cyan/40 hover:bg-white/[0.06]"
    >
      <RecipeHero
        image={recipe.image}
        query={recipe.name}
        emoji={catMeta?.emoji ?? "🍴"}
        gradient={catMeta?.gradient ?? "from-ink-700/50 to-ink-900/0"}
        className="h-12 w-12 shrink-0 rounded-lg"
        emojiClassName="text-xl"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-chalk-50">
          {recipe.name}
        </div>
        <div className="text-[11px] text-chalk-400">
          {kcal} cal · P{p} C{c} F{f}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-chalk-400" />
    </button>
  );
}

function CatalogDetail({
  recipe,
  onBack,
  onLog,
  disabled,
}: {
  recipe: CatalogRecipe;
  onBack: () => void;
  onLog: (s: number) => void;
  disabled: boolean;
}) {
  const [servings, setServings] = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, startSave] = useTransition();
  const perServing = 1 / Math.max(1, recipe.servings);
  const kcal = Math.round(recipe.calories_total * perServing * servings);
  const p = Math.round(recipe.protein_g * perServing * servings);
  const c = Math.round(recipe.carbs_g * perServing * servings);
  const f = Math.round(recipe.fat_g * perServing * servings);

  const cat = categoryFor(recipe);
  const catMeta = cat ? CATEGORY_BY_KEY.get(cat) : null;

  function save() {
    if (saving || saved) return;
    startSave(async () => {
      await saveCatalogRecipe({
        name: recipe.name,
        source: recipe.source ?? null,
        servings: recipe.servings,
        calories_total: recipe.calories_total,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        instructions: recipe.instructions || null,
        ingredients: recipe.ingredients.map((line) => parseIngredient(line)),
        meal_type: defaultMealType(recipe.tags),
      });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to results
      </button>

      {/* Visual hero — Pexels photo when matched, else emoji + gradient */}
      <RecipeHero
        image={recipe.image}
        query={recipe.name}
        emoji={catMeta?.emoji ?? "🍴"}
        gradient={catMeta?.gradient ?? "from-ink-700/50 to-ink-900/0"}
        className="aspect-[16/7] rounded-2xl"
        emojiClassName="text-5xl"
      />

      <div>
        <div className="text-base font-extrabold leading-snug text-chalk-50">
          {recipe.name}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400">
          <span className="rounded bg-accent-amber/15 px-1.5 py-0.5 text-accent-amber">
            {Math.round(recipe.calories_total * perServing)} cal/serving
          </span>
          <span>· {recipe.servings} servings</span>
          {recipe.total_minutes > 0 && (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" /> {recipe.total_minutes} min
            </span>
          )}
        </div>
        {recipe.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 6).map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk-400"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-center">
        <DetailStat label="kcal" value={kcal} color="#f59e0b" />
        <DetailStat label="P" value={`${p}g`} color="#a78bfa" />
        <DetailStat label="C" value={`${c}g`} color="#22d3ee" />
        <DetailStat label="F" value={`${f}g`} color="#fbbf24" />
      </div>

      {/* Actions kept above the recipe text so logging/saving is reachable
          without scrolling past long ingredient + instruction lists. */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div>
          <div className="label-tiny">Servings</div>
          <div className="text-[11px] text-chalk-400">
            Recipe makes {recipe.servings} · log {servings} ×
          </div>
        </div>
        <input
          type="number"
          step={0.25}
          min={0.25}
          value={servings}
          onChange={(e) =>
            setServings(Math.max(0.25, parseFloat(e.target.value) || 1))
          }
          className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-right text-sm font-bold text-chalk-50 outline-none"
        />
      </div>

      <div className="space-y-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onLog(servings)}
          className="btn-primary w-full py-3"
        >
          {disabled ? "Logging…" : "Log meal"}
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || saved}
          className={cn(
            "flex w-full items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-bold transition disabled:opacity-60",
            saved
              ? "border-accent-green/40 bg-accent-green/10 text-accent-green"
              : "border-white/10 bg-white/[0.04] text-chalk-200 hover:bg-white/[0.08]",
          )}
        >
          {saved ? (
            "Saved to your recipes ✓"
          ) : saving ? (
            "Saving…"
          ) : (
            <>
              <BookmarkPlus className="h-4 w-4" /> Save to my recipes
            </>
          )}
        </button>
      </div>

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
  );
}

function FoodResultRow({
  food,
  onSelect,
}: {
  food: FoodItem;
  onSelect: () => void;
}) {
  const u = food.units[0];
  const kcal = u ? Math.round(u.kcal) : null;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 text-left transition hover:border-accent-cyan/40 hover:bg-white/[0.06]"
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink-950">
        {food.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={food.image}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-chalk-500">
            <Barcode className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-[13px] font-bold leading-snug text-chalk-50">
          {food.name}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-chalk-400">
          {food.dataType && <DataTypeChip type={food.dataType} />}
          <span className="truncate">
            {food.brand && <span>{food.brand} · </span>}
            {kcal !== null ? `${kcal} cal · ${u.label}` : "No nutrition data"}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-chalk-400" />
    </button>
  );
}

function DataTypeChip({ type }: { type: string }) {
  // Compact label + colour cue so users can tell a Foundation entry from a
  // Branded one at a glance.
  const map: Record<string, { label: string; tone: string }> = {
    Foundation: { label: "Whole", tone: "text-accent-cyan/90 bg-accent-cyan/10" },
    "SR Legacy": {
      label: "Whole",
      tone: "text-accent-cyan/90 bg-accent-cyan/10",
    },
    "Survey (FNDDS)": {
      label: "Prepared",
      tone: "text-emerald-300/90 bg-emerald-400/10",
    },
    Branded: { label: "Branded", tone: "text-amber-300/90 bg-amber-400/10" },
    Barcode: { label: "Barcode", tone: "text-amber-300/90 bg-amber-400/10" },
  };
  const entry = map[type];
  if (!entry) return null;
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        entry.tone,
      )}
    >
      {entry.label}
    </span>
  );
}

function FoodDetail({
  food,
  onBack,
  onLog,
  disabled,
}: {
  food: FoodItem;
  onBack: () => void;
  onLog: (unit: FoodUnit, qty: number) => void;
  disabled: boolean;
}) {
  const units = food.units;
  const [unitIdx, setUnitIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const unit = units[unitIdx];

  if (units.length === 0 || !unit) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to results
        </button>
        <div className="rounded-xl border border-dashed border-accent-rose/40 p-6 text-center text-xs text-accent-rose">
          No nutrition data for this food. Try Quick entry instead.
        </div>
      </div>
    );
  }

  const kcal = Math.round(unit.kcal * quantity);
  const p = Math.round(unit.protein * quantity);
  const c = Math.round(unit.carbs * quantity);
  const f = Math.round(unit.fat * quantity);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-xs font-bold text-chalk-400 hover:text-chalk-100"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to results
      </button>

      <div className="flex items-start gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-950">
          {food.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={food.image}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-chalk-500">
              <Barcode className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold leading-snug text-chalk-50">
            {food.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-chalk-400">
            {food.dataType && <DataTypeChip type={food.dataType} />}
            {food.brand && <span className="truncate">{food.brand}</span>}
          </div>
          {food.barcode && (
            <div className="mt-1 text-[10px] uppercase tracking-wider text-chalk-500">
              Barcode {food.barcode}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 text-center">
        <DetailStat label="kcal" value={kcal} color="#f59e0b" />
        <DetailStat label="P" value={`${p}g`} color="#a78bfa" />
        <DetailStat label="C" value={`${c}g`} color="#22d3ee" />
        <DetailStat label="F" value={`${f}g`} color="#fbbf24" />
      </div>

      {units.length > 1 && (
        <div>
          <div className="label-tiny mb-1.5">Unit</div>
          <div className="flex flex-wrap gap-1.5">
            {units.map((u, i) => (
              <button
                key={u.label}
                type="button"
                onClick={() => setUnitIdx(i)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11px] font-bold transition",
                  i === unitIdx
                    ? "border-accent-cyan/50 bg-accent-cyan/15 text-accent-cyan"
                    : "border-white/10 bg-white/[0.04] text-chalk-300",
                )}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div>
          <div className="label-tiny">Quantity</div>
          <div className="text-[11px] text-chalk-400">
            × {unit.label}
          </div>
        </div>
        <input
          type="number"
          step={0.25}
          min={0.25}
          value={quantity}
          onChange={(e) =>
            setQuantity(Math.max(0.25, parseFloat(e.target.value) || 1))
          }
          className="w-20 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-right text-sm font-bold text-chalk-50 outline-none"
        />
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onLog(unit, quantity)}
        className="btn-primary w-full py-3"
      >
        {disabled ? "Logging…" : "Log meal"}
      </button>
    </div>
  );
}

function DetailStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-1.5 py-1.5"
      style={{ borderColor: `${color}22` }}
    >
      <div className="text-[9px] font-bold uppercase tracking-wider text-chalk-400">
        {label}
      </div>
      <div className="text-[13px] font-extrabold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function RecipePick({
  recipe,
  onUse,
  disabled,
}: {
  recipe: Recipe;
  onUse: (s: number) => void;
  disabled: boolean;
}) {
  const [s, setS] = useState(1);
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-chalk-50">
          {recipe.name}
        </div>
        <div className="text-[11px] text-chalk-400">
          {recipe.calories_per_serving} cal · P{recipe.protein_g} C
          {recipe.carbs_g} F{recipe.fat_g}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={0.25}
          value={s}
          onChange={(e) => setS(parseFloat(e.target.value) || 1)}
          className="w-14 rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-sm text-chalk-50 outline-none"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => onUse(s)}
          className="rounded-lg bg-accent-cyan px-3 py-1 text-xs font-bold text-ink-950"
        >
          Use
        </button>
      </div>
    </div>
  );
}
