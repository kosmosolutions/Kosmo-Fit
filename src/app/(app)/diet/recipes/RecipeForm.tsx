"use client";

import { useState, useTransition } from "react";
import { Plus, Star, X } from "lucide-react";
import { saveRecipe } from "@/lib/actions/recipes";
import type { MealType } from "@/lib/types";
import { cn } from "@/lib/cn";

const MEALS: Array<MealType | "any"> = ["any", "breakfast", "snack", "lunch", "dinner"];

export function RecipeForm() {
  const [pending, start] = useTransition();
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
  const [ingredients, setIngredients] = useState<
    Array<{ name: string; amount: string }>
  >([{ name: "", amount: "" }]);

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
      <div className="card p-4 space-y-3">
        <label className="block">
          <span className="label-tiny">Name</span>
          <input
            autoFocus
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field mt-1"
            placeholder="e.g. Greek yogurt bowl"
          />
        </label>
        <div>
          <div className="label-tiny mb-1">Best for</div>
          <div className="flex flex-wrap gap-1.5">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, meal_type: m })}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-bold capitalize",
                  form.meal_type === m
                    ? "border-accent-cyan bg-accent-cyan/15 text-accent-cyan"
                    : "border-white/10 bg-white/[0.03] text-chalk-300",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="label-tiny mb-2">Per serving</div>
        <div className="grid grid-cols-2 gap-2">
          <Num label="Calories" v={form.calories_per_serving} unit="cal"
            onChange={(v) => setForm({ ...form, calories_per_serving: v })} />
          <Num label="Servings" v={form.servings} unit="×" step={0.5}
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

      <div className="card p-4">
        <div className="label-tiny mb-2">Ingredients</div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2">
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
                  setIngredients(ingredients.filter((_, idx) => idx !== i))
                }
                className="rounded-lg p-2 text-chalk-400 hover:bg-white/10"
                aria-label="Remove ingredient"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setIngredients([...ingredients, { name: "", amount: "" }])
            }
            className="btn-ghost"
          >
            <Plus className="h-4 w-4" /> Add ingredient
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="label-tiny mb-2">Instructions</div>
        <textarea
          rows={4}
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          placeholder="How do you make it?"
          className="field resize-y"
        />
      </div>

      <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
        <span className="flex items-center gap-2">
          <Star
            className={cn(
              "h-4 w-4",
              form.is_favorite
                ? "fill-accent-amber text-accent-amber"
                : "text-chalk-400",
            )}
          />
          <span className="text-sm font-bold text-chalk-50">Mark as favorite</span>
        </span>
        <input
          type="checkbox"
          checked={form.is_favorite}
          onChange={(e) =>
            setForm({ ...form, is_favorite: e.target.checked })
          }
          className="h-4 w-4 accent-cyan-400"
        />
      </label>

      <button
        type="button"
        disabled={pending || !form.name.trim()}
        onClick={submit}
        className="btn-primary w-full py-3"
      >
        {pending ? "Saving…" : "Save recipe"}
      </button>
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
    <label className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2">
      <span className="label-tiny">{label}</span>
      <span className="mt-1 flex items-baseline gap-1">
        <input
          type="number"
          inputMode="decimal"
          value={v}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border-none bg-transparent p-0 text-lg font-extrabold text-chalk-50 outline-none"
        />
        <span className="text-[10px] text-chalk-400">{unit}</span>
      </span>
    </label>
  );
}
