"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteFoodEntry } from "@/lib/actions/entries";
import type { FoodEntry } from "@/lib/types";

export function FoodEntryRow({ entry }: { entry: FoodEntry }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-start justify-between gap-2 border-b border-white/[0.05] py-2.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <div className="truncate text-sm font-bold text-chalk-50">
            {entry.name}
          </div>
          {entry.servings !== 1 ? (
            <div className="text-[10px] text-chalk-400">
              × {entry.servings}
            </div>
          ) : null}
        </div>
        <div className="text-[11px] text-chalk-400">
          P{entry.protein_g} · C{entry.carbs_g} · F{entry.fat_g}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-extrabold text-chalk-50">
          {entry.calories}
          <span className="ml-0.5 text-[10px] text-chalk-400">cal</span>
        </div>
        <button
          type="button"
          aria-label="Delete entry"
          disabled={pending}
          onClick={() => start(() => deleteFoodEntry(entry.id))}
          className="rounded-lg p-1 text-chalk-400 hover:bg-white/5 hover:text-accent-rose"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
