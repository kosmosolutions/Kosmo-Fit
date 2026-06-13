// FatSecret Platform API client (server-only).
//
// Auth is OAuth2 client_credentials: POST to the token endpoint with the
// client id/secret as HTTP Basic, get a short-lived bearer token, then call
// the REST API. The token is cached in module scope until just before expiry
// so we don't mint one per request (each edge instance keeps its own).
//
// IMPORTANT licensing note: FatSecret recipe content is NOT storable beyond
// 24h (only recipe_id is). So these helpers are used by edge proxies that
// cache responses for <=1h — never to bake a catalog. FatSecret recipes are
// search-only in the UI: there is no "save to my recipes" for them (that would
// persist their content), and visible "Powered by fatsecret" attribution links
// back to www.fatsecret.com wherever results appear.
//
// Setup: register at https://platform.fatsecret.com, set FATSECRET_CLIENT_ID +
// FATSECRET_CLIENT_SECRET, and whitelist 0.0.0.0/0 in the key's IP settings
// (the free tier permits it) so Vercel's dynamic egress IPs can mint tokens.

const TOKEN_URL = "https://oauth.fatsecret.com/connect/token";
const API_URL = "https://platform.fatsecret.com/rest/server.api";

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID;
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET;

export function fatsecretConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("FatSecret credentials not configured");
  }
  // Reuse while >60s of life remains.
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60_000) {
    return cachedToken.value;
  }

  const basic = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=basic",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`FatSecret token ${res.status}`);
  }
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new Error("FatSecret token: no access_token in response");
  }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 86400) * 1000,
  };
  return cachedToken.value;
}

// A bearer-authenticated GET against the REST endpoint with method-style params
// (JSON format). Returns the parsed body.
async function apiGet(params: Record<string, string>): Promise<unknown> {
  const token = await getToken();
  const url = new URL(API_URL);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`FatSecret API ${res.status}`);
  const body = await res.json();
  // FatSecret signals errors as HTTP 200 with an { error: { code, message } }
  // envelope (e.g. invalid IP, missing scope). Surface it instead of letting
  // it read as an empty result set.
  const err = (body as { error?: { code?: number; message?: string } }).error;
  if (err) {
    throw new Error(`FatSecret ${err.code ?? ""}: ${err.message ?? "error"}`.trim());
  }
  return body;
}

// --- Result shapes (subset of the FatSecret response we care about) ---

export interface RecipeSearchResult {
  id: string;
  name: string;
  description: string;
  image: string | null;
  // Per-serving macros as returned by recipes.search (already per serving).
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

function num(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
}

// recipes.search v3 → flat result rows. The v3 shape nests per-serving macros
// under recipe_nutrition; recipe_image is a single URL string.
export async function searchRecipes(
  query: string,
  page = 0,
  maxResults = 20,
): Promise<RecipeSearchResult[]> {
  const body = (await apiGet({
    method: "recipes.search.v3",
    search_expression: query,
    page_number: String(page),
    max_results: String(maxResults),
  })) as {
    recipes?: { recipe?: unknown };
  };

  const raw = body.recipes?.recipe;
  // The API returns a single object (not array) when there's one match.
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];

  return list.map((r) => {
    const rec = r as Record<string, unknown>;
    const nut = (rec.recipe_nutrition ?? {}) as Record<string, unknown>;
    return {
      id: String(rec.recipe_id ?? ""),
      name: String(rec.recipe_name ?? "Untitled"),
      description: String(rec.recipe_description ?? ""),
      image: typeof rec.recipe_image === "string" ? rec.recipe_image : null,
      calories: num(nut.calories),
      protein_g: num(nut.protein),
      carbs_g: num(nut.carbohydrate),
      fat_g: num(nut.fat),
    };
  });
}

export interface RecipeDetail {
  id: string;
  name: string;
  description: string;
  image: string | null;
  servings: number;
  // Totals across all servings (so the dialog's per-serving math matches the
  // static catalog, which stores calories_total).
  calories_total: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  sugar_g: number;
  total_minutes: number;
  ingredients: string[];
  instructions: string;
}

// recipe.get → full detail. Nutrition in recipe.get is per-serving; we multiply
// by serving count to produce totals matching CatalogRecipe.calories_total.
export async function getRecipe(id: string): Promise<RecipeDetail> {
  const body = (await apiGet({
    method: "recipe.get",
    recipe_id: id,
    // Ensure per-serving nutrition (serving_sizes.serving) is included.
    show_nutrition: "1",
  })) as {
    recipe?: Record<string, unknown>;
  };
  const r = body.recipe;
  if (!r) throw new Error("FatSecret recipe.get: empty response");

  const serving = (r.serving_sizes ?? {}) as Record<string, unknown>;
  const ps = (serving.serving ?? {}) as Record<string, unknown>;
  const servings = Math.max(1, num(r.number_of_servings) || 1);

  // Ingredients: recipe_ingredients.ingredient[].ingredient_description.
  const ingWrap = (r.ingredients ?? {}) as Record<string, unknown>;
  const ingRaw = ingWrap.ingredient;
  const ingList = Array.isArray(ingRaw) ? ingRaw : ingRaw ? [ingRaw] : [];
  const ingredients = ingList
    .map((i) => {
      const ing = i as Record<string, unknown>;
      return String(
        ing.ingredient_description ?? ing.food_name ?? "",
      ).trim();
    })
    .filter(Boolean);

  // Directions: recipe.directions.direction[].direction_description, ordered.
  const dirWrap = (r.directions ?? {}) as Record<string, unknown>;
  const dirRaw = dirWrap.direction;
  const dirList = Array.isArray(dirRaw) ? dirRaw : dirRaw ? [dirRaw] : [];
  const instructions = dirList
    .map((d) => String((d as Record<string, unknown>).direction_description ?? ""))
    .filter(Boolean)
    .join("\n\n");

  // recipe_images.recipe_image is either a string or an array of URLs.
  const imgWrap = (r.recipe_images ?? {}) as Record<string, unknown>;
  const imgRaw = imgWrap.recipe_image;
  const image = Array.isArray(imgRaw)
    ? (imgRaw[0] as string) ?? null
    : typeof imgRaw === "string"
      ? imgRaw
      : null;

  return {
    id: String(r.recipe_id ?? id),
    name: String(r.recipe_name ?? "Untitled"),
    description: String(r.recipe_description ?? ""),
    image,
    servings,
    calories_total: Math.round(num(ps.calories) * servings),
    protein_g: Math.round(num(ps.protein) * servings),
    carbs_g: Math.round(num(ps.carbohydrate) * servings),
    fat_g: Math.round(num(ps.fat) * servings),
    fiber_g: Math.round(num(ps.fiber) * servings),
    sugar_g: Math.round(num(ps.sugar) * servings),
    total_minutes:
      num(r.preparation_time_min) + num(r.cooking_time_min),
    ingredients,
    instructions,
  };
}
