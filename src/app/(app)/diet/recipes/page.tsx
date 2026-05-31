import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Library, Plus, Star } from "lucide-react";
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
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/diet"
          className="inline-flex min-h-[40px] items-center gap-1 rounded-full bg-ink-800 px-3 text-[13px] font-semibold text-chalk-200 transition-all duration-200 ease-ios active:scale-[0.96] hover:bg-ink-700 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/diet/recipes/catalog" className="btn-secondary">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Browse catalog</span>
            <span className="sm:hidden">Library</span>
          </Link>
          <Link href="/diet/recipes/new" className="btn bg-accent-orange text-black hover:brightness-110">
            <Plus className="h-4 w-4" /> New
          </Link>
        </div>
      </div>

      <div>
        <div className="metric-label">Recipe library</div>
        <h1 className="display text-[28px] leading-tight text-white">
          Your saved meals
        </h1>
      </div>

      {rcps.length === 0 ? (
        <div className="card p-8 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-chalk-400" />
          <div className="mt-3 text-[17px] font-bold text-white">
            No recipes yet
          </div>
          <p className="mx-auto mt-1 max-w-xs text-[13px] font-medium text-chalk-300">
            Save go-to meals. Logging next time is one tap.
          </p>
          <Link
            href="/diet/recipes/new"
            className="btn bg-accent-orange text-black hover:brightness-110 mt-5 inline-flex"
          >
            <Plus className="h-4 w-4" /> Add first
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rcps.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-2xl bg-ink-850 p-4 shadow-bento"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-[15px] font-semibold text-white">
                    {r.name}
                  </div>
                  {r.is_favorite ? (
                    <Star className="h-3.5 w-3.5 fill-accent-amber text-accent-amber" />
                  ) : null}
                  {r.meal_type ? (
                    <span className="pill capitalize">{r.meal_type}</span>
                  ) : null}
                </div>
                <div className="mt-1 text-[12px] font-medium text-chalk-400">
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
