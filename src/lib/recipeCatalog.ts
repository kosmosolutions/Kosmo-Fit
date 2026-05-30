import type { MealType } from "@/lib/types";

// Shared shape + helpers for the bundled /recipe-catalog.json, used by both the
// full library browser (RecipeCatalogClient) and the in-dialog recipe picker
// (AddMealDialog). Facet logic that's specific to the library browser (diet
// style, cuisine, macro lean) stays local to that component.

export interface CatalogRecipe {
  id: string;
  name: string;
  source: string | null;
  servings: number;
  calories_total: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  total_minutes: number;
  instructions: string;
  ingredients: string[];
  tags: string[];
  // Populated offline by scripts/enrich-recipe-images.mjs (Pexels). Optional:
  // recipes without a match fall back to the emoji + gradient hero.
  image?: string | null;
}

// Primary category tiles. Mirrors the workout muscle-group browser — emoji +
// gradient + count, picked from the high-coverage tags in the catalog.
export type Category = {
  key: string;
  label: string;
  emoji: string;
  gradient: string;
  // Tag predicate: recipe matches when ANY of these tags is present.
  match: string[];
};

export const CATEGORIES: Category[] = [
  {
    key: "breakfast",
    label: "Breakfast",
    emoji: "🍳",
    gradient: "from-amber-500/45 to-amber-500/0",
    match: ["breakfast"],
  },
  {
    key: "mains",
    label: "Mains",
    emoji: "🍽️",
    gradient: "from-rose-500/45 to-rose-500/0",
    match: ["main"],
  },
  {
    key: "salad",
    label: "Salads",
    emoji: "🥗",
    gradient: "from-emerald-500/45 to-emerald-500/0",
    match: ["salad"],
  },
  {
    key: "pasta",
    label: "Pasta",
    emoji: "🍝",
    gradient: "from-orange-500/45 to-orange-500/0",
    match: ["pasta"],
  },
  {
    key: "soup",
    label: "Soups",
    emoji: "🍜",
    gradient: "from-amber-600/45 to-amber-600/0",
    match: ["soup"],
  },
  {
    key: "seafood",
    label: "Seafood",
    emoji: "🐟",
    gradient: "from-sky-500/45 to-sky-500/0",
    match: ["seafood", "shrimp", "salmon", "fish"],
  },
  {
    key: "sandwich",
    label: "Sandwich",
    emoji: "🥪",
    gradient: "from-yellow-500/45 to-yellow-500/0",
    match: ["sandwich"],
  },
  {
    key: "dessert",
    label: "Dessert",
    emoji: "🍰",
    gradient: "from-pink-500/45 to-pink-500/0",
    match: ["dessert", "icecream"],
  },
];

export const CATEGORY_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

// First-match wins so "Seafood" wins over "Mains" (a shrimp scampi is tagged
// as both `main` and `seafood`; we want the more specific tile).
const CATEGORY_PRIORITY = [
  "breakfast",
  "dessert",
  "soup",
  "salad",
  "pasta",
  "seafood",
  "sandwich",
  "mains",
];

export function categoryFor(recipe: CatalogRecipe): string | null {
  const tagSet = new Set(recipe.tags.map((t) => t.toLowerCase()));
  for (const key of CATEGORY_PRIORITY) {
    const cat = CATEGORY_BY_KEY.get(key);
    if (!cat) continue;
    if (cat.match.some((m) => tagSet.has(m))) return cat.key;
  }
  return null;
}

export function defaultMealType(tags: string[]): MealType | "any" {
  const t = new Set(tags);
  if (t.has("breakfast")) return "breakfast";
  if (t.has("dessert") || t.has("drink") || t.has("appetizer")) return "snack";
  if (t.has("soup") || t.has("salad") || t.has("sandwich")) return "lunch";
  if (t.has("main") || t.has("pasta") || t.has("seafood")) return "dinner";
  return "any";
}

export function perServingMacros(r: CatalogRecipe) {
  const s = Math.max(1, r.servings || 1);
  return {
    kcal: Math.round(r.calories_total / s),
    p: Math.round(r.protein_g / s),
    c: Math.round(r.carbs_g / s),
    f: Math.round(r.fat_g / s),
  };
}

// Split "1/2 cup oats" into {amount, name}; falls back to {name: line} when
// no leading quantity is present.
export function parseIngredient(line: string): { name: string; amount?: string } {
  const trimmed = line.trim();
  if (!trimmed) return { name: "" };
  const m = trimmed.match(
    /^(\d[\d./\s-]*\s?(?:cup|cups|tablespoon|tablespoons|teaspoon|teaspoons|tbsp|tsp|oz|ounce|ounces|pound|pounds|lb|lbs|gram|grams|g|kg|ml|l|liter|liters|clove|cloves|slice|slices|piece|pieces|can|cans|stick|sticks)?)\s+(.+)$/i,
  );
  if (m) {
    return { amount: m[1].trim(), name: m[2].trim() };
  }
  return { name: trimmed };
}
