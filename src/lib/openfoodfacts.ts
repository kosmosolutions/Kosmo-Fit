// Client for the public OpenFoodFacts API (world.openfoodfacts.org).
// No auth, CORS-enabled — runs directly from the browser.

export interface OffProduct {
  code: string;
  name: string;
  brand: string | null;
  image: string | null;
  // Per-serving values when the product declares a serving size.
  servingSize: string | null;
  servingGrams: number | null;
  kcalPerServing: number | null;
  proteinPerServing: number | null;
  carbsPerServing: number | null;
  fatPerServing: number | null;
  // Per-100g fallback — always present when the product has any nutrition data.
  kcalPer100g: number | null;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
}

// One unit the user can log in. We always store "1 serving = serving size or
// 100 g" so the per-unit values map cleanly to a `food_entries` row.
export interface OffUnit {
  label: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const SEARCH_FIELDS = [
  "code",
  "product_name",
  "brands",
  "image_small_url",
  "serving_size",
  "serving_quantity",
  "nutriments",
].join(",");

interface OffApiProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  serving_size?: string;
  serving_quantity?: string | number;
  nutriments?: Record<string, number | undefined>;
}

function normalize(p: OffApiProduct): OffProduct | null {
  if (!p.product_name || !p.code) return null;
  const n = p.nutriments ?? {};
  const num = (v: number | undefined) =>
    typeof v === "number" && Number.isFinite(v) ? v : null;
  const servingGrams =
    typeof p.serving_quantity === "number"
      ? p.serving_quantity
      : typeof p.serving_quantity === "string"
        ? parseFloat(p.serving_quantity) || null
        : null;
  return {
    code: p.code,
    name: p.product_name.trim(),
    brand: p.brands ? p.brands.split(",")[0].trim() : null,
    image: p.image_small_url ?? null,
    servingSize: p.serving_size ?? null,
    servingGrams,
    kcalPerServing: num(n["energy-kcal_serving"]),
    proteinPerServing: num(n["proteins_serving"]),
    carbsPerServing: num(n["carbohydrates_serving"]),
    fatPerServing: num(n["fat_serving"]),
    kcalPer100g: num(n["energy-kcal_100g"]),
    proteinPer100g: num(n["proteins_100g"]),
    carbsPer100g: num(n["carbohydrates_100g"]),
    fatPer100g: num(n["fat_100g"]),
  };
}

export async function searchOpenFoodFacts(
  query: string,
  signal?: AbortSignal,
): Promise<OffProduct[]> {
  const q = query.trim();
  if (!q) return [];
  // Use the v1 CGI endpoint. /api/v2/search's `search_terms` is a weak filter
  // and combined with `sort_by=popularity_key` it tends to return the same
  // popularity-top products regardless of query. The CGI endpoint is the
  // canonical full-text search and ranks by text relevance.
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", q);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", "20");
  url.searchParams.set("fields", SEARCH_FIELDS);
  const r = await fetch(url.toString(), { signal });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = (await r.json()) as { products?: OffApiProduct[] };
  return (data.products ?? [])
    .map(normalize)
    .filter((p): p is OffProduct => p !== null);
}

export async function lookupBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<OffProduct | null> {
  const code = barcode.trim();
  if (!code) return null;
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${SEARCH_FIELDS}`;
  const r = await fetch(url, { signal });
  if (!r.ok) {
    if (r.status === 404) return null;
    throw new Error(`HTTP ${r.status}`);
  }
  const data = (await r.json()) as { status?: number; product?: OffApiProduct };
  if (data.status !== 1 || !data.product) return null;
  return normalize(data.product);
}

// Builds the unit options a user can log this product in. Serving comes first
// (most useful), then per-100g fallback. If only one is available we still
// return a single option so the UI doesn't have to special-case.
export function unitsFor(product: OffProduct): OffUnit[] {
  const out: OffUnit[] = [];
  if (
    product.kcalPerServing !== null &&
    product.servingGrams &&
    product.servingGrams > 0
  ) {
    out.push({
      label: product.servingSize
        ? `1 serving (${product.servingSize})`
        : `1 serving (${product.servingGrams} g)`,
      grams: product.servingGrams,
      kcal: product.kcalPerServing,
      protein: product.proteinPerServing ?? 0,
      carbs: product.carbsPerServing ?? 0,
      fat: product.fatPerServing ?? 0,
    });
  }
  if (product.kcalPer100g !== null) {
    out.push({
      label: "100 g",
      grams: 100,
      kcal: product.kcalPer100g,
      protein: product.proteinPer100g ?? 0,
      carbs: product.carbsPer100g ?? 0,
      fat: product.fatPer100g ?? 0,
    });
  }
  // If per-serving wasn't directly published but we have grams + per-100g,
  // synthesize a per-serving unit from the 100g values.
  if (
    out.length === 1 &&
    out[0].label === "100 g" &&
    product.servingGrams &&
    product.servingGrams > 0
  ) {
    const factor = product.servingGrams / 100;
    out.unshift({
      label: product.servingSize
        ? `1 serving (${product.servingSize})`
        : `1 serving (${product.servingGrams} g)`,
      grams: product.servingGrams,
      kcal: out[0].kcal * factor,
      protein: out[0].protein * factor,
      carbs: out[0].carbs * factor,
      fat: out[0].fat * factor,
    });
  }
  return out;
}
