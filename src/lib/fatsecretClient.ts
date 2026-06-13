import type { CatalogRecipe } from "@/lib/recipeCatalog";

// Client-side helpers for the FatSecret recipe proxies. Results are mapped into
// the CatalogRecipe shape so the dialog reuses the same row + detail components
// the static library uses. `source` is set to "FatSecret" for attribution.

// Mirrors the flat search row from /api/recipes/search (RecipeSearchResult on
// the server). Duplicated here so the client never imports the server module
// (which reads credentials at the top level).
export interface FatSecretSearchRow {
  id: string;
  name: string;
  description: string;
  image: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export type FatSecretSearchState =
  | { status: "ok"; recipes: FatSecretSearchRow[] }
  | { status: "not_configured" }
  | { status: "error"; message: string };

export async function searchFatSecret(
  query: string,
  signal?: AbortSignal,
): Promise<FatSecretSearchState> {
  const res = await fetch(
    `/api/recipes/search?q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!res.ok) {
    return { status: "error", message: `Search failed (${res.status})` };
  }
  const data = (await res.json()) as {
    recipes?: FatSecretSearchRow[];
    error?: string;
  };
  if (data.error === "not_configured") return { status: "not_configured" };
  if (data.error) return { status: "error", message: data.error };
  return { status: "ok", recipes: data.recipes ?? [] };
}

// A search row → partial CatalogRecipe good enough for the result list. Macros
// from search are already per-serving, so servings=1 keeps the row math right.
export function searchRowToCatalog(row: FatSecretSearchRow): CatalogRecipe {
  return {
    id: `fs:${row.id}`,
    name: row.name,
    source: "FatSecret",
    servings: 1,
    calories_total: Math.round(row.calories),
    protein_g: Math.round(row.protein_g),
    carbs_g: Math.round(row.carbs_g),
    fat_g: Math.round(row.fat_g),
    fiber_g: 0,
    sugar_g: 0,
    total_minutes: 0,
    instructions: "",
    ingredients: [],
    tags: [],
    image: row.image,
  };
}

// Fetch full detail for a FatSecret recipe and map it into a CatalogRecipe.
// `id` is the raw FatSecret recipe_id (without the "fs:" prefix).
export async function getFatSecretRecipe(
  id: string,
  signal?: AbortSignal,
): Promise<CatalogRecipe> {
  const res = await fetch(`/api/recipes/${encodeURIComponent(id)}`, { signal });
  if (!res.ok) throw new Error(`Recipe load failed (${res.status})`);
  const data = (await res.json()) as {
    recipe?: {
      id: string;
      name: string;
      description: string;
      image: string | null;
      servings: number;
      calories_total: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
      fiber_g: number;
      sugar_g: number;
      total_minutes: number;
      ingredients: string[];
      instructions: string;
    };
    error?: string;
  };
  if (!data.recipe) throw new Error(data.error ?? "No recipe");
  const r = data.recipe;
  return {
    id: `fs:${r.id}`,
    name: r.name,
    source: "FatSecret",
    servings: Math.max(1, r.servings),
    calories_total: r.calories_total,
    protein_g: r.protein_g,
    carbs_g: r.carbs_g,
    fat_g: r.fat_g,
    fiber_g: r.fiber_g,
    sugar_g: r.sugar_g,
    total_minutes: r.total_minutes,
    instructions: r.instructions,
    ingredients: r.ingredients,
    tags: [],
    image: r.image,
  };
}
