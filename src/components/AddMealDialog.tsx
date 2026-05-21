"use client";

import { useState, useTransition } from "react";
import { Plus, X, BookOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { addFoodEntry } from "@/lib/actions/entries";
import type { MealType, Recipe } from "@/lib/types";

const MEALS: MealType[] = ["breakfast", "snack", "lunch", "dinner"];

export function AddMealDialog({
  entryDate,
  recipes,
  defaultMeal,
  triggerClassName,
}: {
  entryDate: string;
  recipes: Recipe[];
  defaultMeal?: MealType;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "recipe">("new");
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    meal_type: defaultMeal ?? ("breakfast" as MealType),
    name: "",
    servings: 1,
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
  });

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

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (defaultMeal) setForm({ ...form, meal_type: defaultMeal });
          setOpen(true);
        }}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold text-chalk-200 hover:bg-white/10",
          triggerClassName,
        )}
      >
        <Plus className="h-3.5 w-3.5" /> Add
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-white/10 bg-ink-900 p-5 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-extrabold text-chalk-50">
                Log a meal
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-chalk-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-4 gap-1">
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

            <div className="mb-3 flex gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
              <button
                type="button"
                onClick={() => setTab("new")}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-bold transition",
                  tab === "new"
                    ? "bg-white/[0.08] text-chalk-50"
                    : "text-chalk-300",
                )}
              >
                Quick entry
              </button>
              <button
                type="button"
                onClick={() => setTab("recipe")}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-bold transition",
                  tab === "recipe"
                    ? "bg-white/[0.08] text-chalk-50"
                    : "text-chalk-300",
                )}
              >
                From recipe ({recipes.length})
              </button>
            </div>

            {tab === "new" ? (
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
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {recipes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center">
                    <BookOpen className="mx-auto h-5 w-5 text-chalk-400" />
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
