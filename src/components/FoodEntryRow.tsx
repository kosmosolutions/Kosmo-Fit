"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { deleteFoodEntry, updateFoodEntry } from "@/lib/actions/entries";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";
import { cn } from "@/lib/cn";
import type { FoodEntry, MealType } from "@/lib/types";

const MEALS: MealType[] = ["breakfast", "snack", "lunch", "dinner"];

export function FoodEntryRow({ entry }: { entry: FoodEntry }) {
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-start justify-between gap-2 border-b border-white/[0.05] py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <div className="truncate text-[14px] font-semibold text-white">
            {entry.name}
          </div>
          {entry.servings !== 1 ? (
            <div className="text-[11px] font-medium text-chalk-400">
              × {entry.servings}
            </div>
          ) : null}
        </div>
        <div className="mt-0.5 text-[11px] font-medium text-chalk-400">
          P{entry.protein_g} · C{entry.carbs_g} · F{entry.fat_g}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="text-[14px] font-bold text-white">
          {entry.calories}
          <span className="ml-0.5 text-[10px] font-medium text-chalk-400">
            cal
          </span>
        </div>
        <button
          type="button"
          aria-label="Edit entry"
          onClick={() => setEditing(true)}
          className="grid h-8 w-8 place-items-center rounded-full text-chalk-400 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-accent-blue/15 hover:text-accent-blue"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Delete entry"
          disabled={pending}
          onClick={() => start(() => deleteFoodEntry(entry.id))}
          className="grid h-8 w-8 place-items-center rounded-full text-chalk-400 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-accent-rose/15 hover:text-accent-rose disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {editing && (
        <EditFoodModal entry={entry} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}

function EditFoodModal({
  entry,
  onClose,
}: {
  entry: FoodEntry;
  onClose: () => void;
}) {
  const [saving, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    meal_type: entry.meal_type,
    name: entry.name,
    servings: entry.servings,
    calories: entry.calories,
    protein_g: entry.protein_g,
    carbs_g: entry.carbs_g,
    fat_g: entry.fat_g,
  });
  useBodyScrollLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function save() {
    if (!form.name.trim()) return;
    setError(null);
    start(async () => {
      try {
        await updateFoodEntry(entry.id, {
          meal_type: form.meal_type,
          name: form.name.trim(),
          servings: form.servings || 1,
          calories: Math.round(form.calories),
          protein_g: Math.round(form.protein_g),
          carbs_g: Math.round(form.carbs_g),
          fat_g: Math.round(form.fat_g),
        });
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Edit food entry"
      onClick={onClose}
    >
      <div
        className="w-full overflow-hidden rounded-t-3xl bg-ink-850 sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 p-5 pb-3">
          <div className="text-[18px] font-bold tracking-tight text-white">
            Edit entry
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full bg-ink-800 text-chalk-300 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-ink-700 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5 pt-0">
          <label className="block">
            <span className="label-tiny">Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="field mt-1"
            />
          </label>

          <div className="grid grid-cols-4 gap-1.5">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, meal_type: m })}
                className={cn(
                  "min-h-[36px] rounded-full text-[12px] font-semibold capitalize transition-all duration-200 ease-ios active:scale-[0.96]",
                  form.meal_type === m
                    ? "bg-accent-orange/20 text-accent-orange"
                    : "bg-ink-800 text-chalk-300 hover:bg-ink-700",
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Num
              label="Calories"
              unit="cal"
              value={form.calories}
              onChange={(v) => setForm({ ...form, calories: v })}
            />
            <Num
              label="Servings"
              unit="×"
              step={0.1}
              value={form.servings}
              onChange={(v) => setForm({ ...form, servings: v })}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Num
              label="Protein"
              unit="g"
              value={form.protein_g}
              onChange={(v) => setForm({ ...form, protein_g: v })}
            />
            <Num
              label="Carbs"
              unit="g"
              value={form.carbs_g}
              onChange={(v) => setForm({ ...form, carbs_g: v })}
            />
            <Num
              label="Fat"
              unit="g"
              value={form.fat_g}
              onChange={(v) => setForm({ ...form, fat_g: v })}
            />
          </div>

          {error && (
            <div className="rounded-xl bg-accent-rose/15 px-4 py-3 text-[13px] font-semibold text-accent-rose">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !form.name.trim()}
              className="btn flex-1 bg-accent-orange text-black hover:brightness-110 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Num({
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
          min={0}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full border-none bg-transparent p-0 text-lg font-extrabold text-chalk-50 outline-none"
        />
        <span className="text-[10px] text-chalk-400">{unit}</span>
      </span>
    </label>
  );
}
