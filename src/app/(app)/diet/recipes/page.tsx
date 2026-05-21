import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Plus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteRecipeButton } from "./DeleteRecipeButton";
import type { Recipe } from "@/lib/types";

export default async function RecipesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: recipes } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", user.id)
    .order("is_favorite", { ascending: false })
    .order("name");

  const rcps = (recipes ?? []) as Recipe[];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/diet"
          className="flex items-center gap-1 text-sm font-bold text-chalk-300 hover:text-chalk-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Link href="/diet/recipes/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New recipe
        </Link>
      </div>

      <div>
        <div className="label-tiny">Recipe library</div>
        <h1 className="text-2xl font-extrabold tracking-tight text-chalk-50">
          Your saved meals
        </h1>
      </div>

      {rcps.length === 0 ? (
        <div className="card-elev p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-chalk-400" />
          <div className="mt-3 text-base font-bold text-chalk-50">
            No recipes yet
          </div>
          <p className="mx-auto mt-1 max-w-xs text-sm text-chalk-300">
            Save your go-to meals here. Logging next time is one tap.
          </p>
          <Link
            href="/diet/recipes/new"
            className="btn-primary mt-5 inline-flex"
          >
            <Plus className="h-4 w-4" /> Add your first
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rcps.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-bold text-chalk-50">
                    {r.name}
                  </div>
                  {r.is_favorite ? (
                    <Star className="h-3.5 w-3.5 fill-accent-amber text-accent-amber" />
                  ) : null}
                  {r.meal_type ? (
                    <span className="pill capitalize">{r.meal_type}</span>
                  ) : null}
                </div>
                <div className="mt-1 text-[11px] text-chalk-400">
                  {r.calories_per_serving} cal/serving · P{r.protein_g} C
                  {r.carbs_g} F{r.fat_g}
                </div>
              </div>
              <DeleteRecipeButton id={r.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
