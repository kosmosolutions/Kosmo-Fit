"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteFoodEntry } from "@/lib/actions/entries";
import type { FoodEntry } from "@/lib/types";

export function FoodEntryRow({ entry }: { entry: FoodEntry }) {
  const [pending, start] = useTransition();
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
      <div className="flex items-center gap-2">
        <div className="text-[14px] font-bold text-white">
          {entry.calories}
          <span className="ml-0.5 text-[10px] font-medium text-chalk-400">
            cal
          </span>
        </div>
        <button
          type="button"
          aria-label="Delete entry"
          disabled={pending}
          onClick={() => start(() => deleteFoodEntry(entry.id))}
          className="grid h-8 w-8 place-items-center rounded-full text-chalk-400 transition-all duration-200 ease-ios active:scale-[0.92] hover:bg-accent-rose/15 hover:text-accent-rose"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
