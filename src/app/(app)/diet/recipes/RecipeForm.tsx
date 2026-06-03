"use client";

import { useMemo, useState, useTransition } from "react";
import { Calculator, Plus, Search, Star, X } from "lucide-react";
import { saveRecipe } from "@/lib/actions/recipes";
import {
  IngredientPicker,
  type PickedIngredient,
} from "@/components/IngredientPicker";
import type { MealType } from "@/lib/types";
import { cn } from "@/lib/cn";

const MEALS: Array<MealType | "any"> = ["any", "breakfast", "snack", "lunch", "dinner"];

type Ingredient = {
  name: string;
  amount: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

const blankIngredient = (): Ingredient => ({
  name: "",
  amount: "",
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
});

export function RecipeForm() {
  const [pending, start] = useTransition();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    meal_type: "any" as MealType | "any",
    servings: 1,
    calories_per_serving: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    instructions: "",
    is_favorite: false,
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    blankIngredient(),
  ]);

  // Running nutrition from every data-backed ingredient (USDA / barcode /
  // custom-with-macros). Drives the "Sum from ingredients" auto-fill.
  const ingredientTotals = useMemo(
    () =>
      ingredients.reduce(
        (acc, i) => {
          acc.kcal += i.kcal;
          acc.protein += i.protein;
          acc.carbs += i.carbs;
          acc.fat += i.fat;
          return acc;
        },
        { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      ),
    [ingredients],
  );
  const hasIngredientMacros = ingredientTotals.kcal > 0;

  function sumFromIngredients() {
    const s = Math.max(0.1, form.servings || 1);
    setForm({
      ...form,
      calories_per_serving: Math.round(ingredientTotals.kcal / s),
      protein_g: Math.round(ingredientTotals.protein / s),
      carbs_g: Math.round(ingredientTotals.carbs / s),
      fat_g: Math.round(ingredientTotals.fat / s),
    });
  }

  function addPicked(ing: PickedIngredient) {
    setIngredients((prev) => {
      // Drop a leading blank placeholder row when adding the first real one.
      const base =
        prev.length === 1 && !prev[0].name.trim() && prev[0].kcal === 0
          ? []
          : prev;
      return [...base, ing];
    });
  }

  function submit() {
    if (!form.name.trim()) return;
    start(async () => {
      await saveRecipe({
        ...form,
        ingredients: ingredients
          .map((i) => ({ name: i.name.trim(), amount: i.amount.trim() }))
          .filter((i) => i.name),
        instructions: form.instructions.trim() || null,
        meal_type: form.meal_type as MealType | "any",
      });
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-3">
        <label className="block">
          <span className="metric-label">Name</span>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field mt-1"
            placeholder="e.g. Greek yogurt bowl"
          />
        </label>
        <div>
          <div className="metric-label mb-1.5">Best for</div>
          <div className="flex flex-wrap gap-1.5">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, meal_type: m })}
                className={cn(
                  "min-h-[36px] rounded-full px-4 text-[12px] font-semibold capitalize transition-all duration-200 ease-ios active:scale-[0.96]",
                  form.meal_type === m
                    ? "bg-accent-orange/20 text-accent-orange"
                    : "bg-ink-800 text-chalk-300 hover:bg-ink-700",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="metric-label">Per serving</div>
          {hasIngredientMacros && (
            <button
              type="button"
              onClick={sumFromIngredients}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent-cyan/15 px-3 py-1 text-[11px] font-semibold text-accent-cyan transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-accent-cyan/25"
            >
              <Calculator className="h-3 w-3" /> Sum from ingredients
            </button>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Num label="Calories" v={form.calories_per_serving} unit="cal"
            onChange={(v) => setForm({ ...form, calories_per_serving: v })} />
          <Num label="Servings" v={form.servings} unit="×" step={0.1}
            onChange={(v) => setForm({ ...form, servings: v || 1 })} />
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Num label="Protein" v={form.protein_g} unit="g"
            onChange={(v) => setForm({ ...form, protein_g: v })} />
          <Num label="Carbs" v={form.carbs_g} unit="g"
            onChange={(v) => setForm({ ...form, carbs_g: v })} />
          <Num label="Fat" v={form.fat_g} unit="g"
            onChange={(v) => setForm({ ...form, fat_g: v })} />
        </div>
      </div>

      <div className="card p-5">
        <div className="metric-label mb-2">Ingredients</div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-2">
                <input
                  value={ing.amount}
                  onChange={(e) => {
                    const next = [...ingredients];
                    next[i] = { ...next[i], amount: e.target.value };
                    setIngredients(next);
                  }}
                  placeholder="1 cup"
                  className="field w-24"
                />
                <input
                  value={ing.name}
                  onChange={(e) => {
                    const next = [...ingredients];
                    next[i] = { ...next[i], name: e.target.value };
                    setIngredients(next);
                  }}
                  placeholder="oats"
                  className="field flex-1"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIngredients(
                      ingredients.length === 1
                        ? [blankIngredient()]
                        : ingredients.filter((_, idx) => idx !== i),
                    )
                  }
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-800 text-chalk-400 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-accent-rose/15 hover:text-accent-rose"
                  aria-label="Remove ingredient"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {ing.kcal > 0 && (
                <div className="pl-1 text-[10px] font-semibold uppercase tracking-wider text-chalk-500">
                  {Math.round(ing.kcal)} cal · P{Math.round(ing.protein)} C
                  {Math.round(ing.carbs)} F{Math.round(ing.fat)}
                </div>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="btn-ghost"
            >
              <Search className="h-4 w-4" /> Search foods / barcode
            </button>
            <button
              type="button"
              onClick={() =>
                setIngredients([...ingredients, blankIngredient()])
              }
              className="btn-ghost"
            >
              <Plus className="h-4 w-4" /> Blank row
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="metric-label mb-2">Instructions</div>
        <textarea
          rows={4}
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="How do you make it?"
          className="field resize-y"
        />
      </div>

      <label className="card flex cursor-pointer items-center justify-between p-4">
        <span className="flex items-center gap-2">
          <Star
            className={cn(
              "h-4 w-4",
              form.is_favorite
                ? "fill-accent-amber text-accent-amber"
                : "text-chalk-400",
            )}
          />
          <span className="text-[15px] font-semibold text-white">Mark as favorite</span>
        </span>
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(e) =>
            setForm({ ...form, is_favorite: e.target.checked })
          }
          className="h-5 w-5 accent-orange-400"
        />
      </label>

      <button
        type="button"
        disabled={pending || !form.name.trim()}
        onClick={submit}
        className="btn w-full bg-accent-orange text-black hover:brightness-110 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save recipe"}
      </button>

      {pickerOpen && (
        <IngredientPicker
          onAdd={addPicked}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function Num({
  label,
  v,
  unit,
  onChange,
  step = 1,
}: {
  label: string;
  v: number;
  unit: string;
  onChange: (n: number) => void;
  step?: number;
}) {
  return (
    <label className="rounded-2xl bg-ink-800 p-3">
      <span className="metric-label">{label}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={v}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border-none bg-transparent p-0 font-display text-[22px] font-black tracking-tightest text-white outline-none"
        />
        <span className="text-[11px] font-medium text-chalk-400">{unit}</span>
      </span>
    </label>
  );
}
