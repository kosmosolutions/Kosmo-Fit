"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteRecipe } from "@/lib/actions/recipes";

export function DeleteRecipeButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Delete this recipe?")) start(() => deleteRecipe(id));
      }}
      className="rounded-lg p-2 text-chalk-400 hover:bg-white/5 hover:text-accent-rose"
      aria-label="Delete recipe"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
