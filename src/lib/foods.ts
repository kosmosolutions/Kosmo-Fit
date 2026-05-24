// Unified food data layer:
//  - Name search → USDA FoodData Central (proxied via /api/foods/search so
//    we can attach our API key without exposing it to the browser).
//  - Barcode lookup → OpenFoodFacts (proxied via /api/foods/barcode/[code]
//    so we can set a proper User-Agent and avoid Safari CORS issues).
//
// Everything the UI consumes is normalized into the FoodItem / FoodUnit
// shape below — the source distinction only matters for the chip we
// render next to the name.

export type FoodSource = "usda" | "off";

export interface FoodUnit {
  label: string;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodItem {
  id: string;
  source: FoodSource;
  name: string;
  brand: string | null;
  image: string | null;
  // "Foundation" | "SR Legacy" | "Survey (FNDDS)" | "Branded" for USDA,
  // "Barcode" for OFF. Surfaced as a chip so users can tell whole-foods
  // (Foundation/SR Legacy) from packaged-product entries at a glance.
  dataType: string | null;
  barcode: string | null;
  units: FoodUnit[];
}

// ---- USDA ----

interface UsdaFood {
  fdcId?: number;
  description?: string;
  dataType?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients?: {
    nutrientId?: number;
    value?: number;
    unitName?: string;
  }[];
}

// USDA nutrient IDs (FoodData Central catalog).
const NUT_KCAL = 1008;
const NUT_PROTEIN = 1003;
const NUT_CARBS = 1005;
const NUT_FAT = 1004;

function usdaNutrient(food: UsdaFood, id: number): number {
  const n = food.foodNutrients?.find((x) => x.nutrientId === id);
  return typeof n?.value === "number" && Number.isFinite(n.value) ? n.value : 0;
}

function normalizeUsda(food: UsdaFood): FoodItem | null {
  if (!food.description || !food.fdcId) return null;
  // USDA returns all nutrients per 100 g regardless of dataType.
  const per100 = {
    kcal: usdaNutrient(food, NUT_KCAL),
    protein: usdaNutrient(food, NUT_PROTEIN),
    carbs: usdaNutrient(food, NUT_CARBS),
    fat: usdaNutrient(food, NUT_FAT),
  };
  if (per100.kcal === 0 && per100.protein === 0 && per100.carbs === 0 && per100.fat === 0) {
    return null;
  }

  const units: FoodUnit[] = [
    { label: "100 g", grams: 100, ...per100 },
  ];

  // Branded foods publish a serving size in grams + a household description.
  // Surface it as the preferred unit when available.
  if (
    food.servingSize &&
    food.servingSize > 0 &&
    food.servingSizeUnit?.toLowerCase() === "g"
  ) {
    const factor = food.servingSize / 100;
    const label = food.householdServingFullText
      ? `1 serving (${food.householdServingFullText})`
      : `1 serving (${food.servingSize} g)`;
    units.unshift({
      label,
      grams: food.servingSize,
      kcal: per100.kcal * factor,
      protein: per100.protein * factor,
      carbs: per100.carbs * factor,
      fat: per100.fat * factor,
    });
  }

  const brand = food.brandOwner?.trim() || food.brandName?.trim() || null;
  return {
    id: `usda:${food.fdcId}`,
    source: "usda",
    name: food.description.trim(),
    brand,
    image: null,
    dataType: food.dataType ?? null,
    barcode: food.gtinUpc?.trim() || null,
    units,
  };
}

export async function searchFoods(
  query: string,
  signal?: AbortSignal,
): Promise<FoodItem[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const r = await fetch(`/api/foods/search?q=${encodeURIComponent(q)}`, {
    signal,
  });
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `HTTP ${r.status}`);
  }
  const data = (await r.json()) as { foods?: UsdaFood[] };
  return (data.foods ?? [])
    .map(normalizeUsda)
    .filter((f): f is FoodItem => f !== null);
}

// ---- OpenFoodFacts (barcode only) ----

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  serving_size?: string;
  serving_quantity?: string | number;
  nutriments?: Record<string, number | undefined>;
}

function offNum(v: number | undefined): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function normalizeOff(p: OffProduct): FoodItem | null {
  if (!p.product_name || !p.code) return null;
  const n = p.nutriments ?? {};
  const per100 = {
    kcal: offNum(n["energy-kcal_100g"]),
    protein: offNum(n["proteins_100g"]),
    carbs: offNum(n["carbohydrates_100g"]),
    fat: offNum(n["fat_100g"]),
  };
  const servingGrams =
    typeof p.serving_quantity === "number"
      ? p.serving_quantity
      : typeof p.serving_quantity === "string"
        ? parseFloat(p.serving_quantity) || null
        : null;

  const units: FoodUnit[] = [];
  if (servingGrams && servingGrams > 0) {
    const factor = servingGrams / 100;
    units.push({
      label: p.serving_size
        ? `1 serving (${p.serving_size})`
        : `1 serving (${servingGrams} g)`,
      grams: servingGrams,
      kcal: per100.kcal * factor,
      protein: per100.protein * factor,
      carbs: per100.carbs * factor,
      fat: per100.fat * factor,
    });
  }
  if (per100.kcal || per100.protein || per100.carbs || per100.fat) {
    units.push({ label: "100 g", grams: 100, ...per100 });
  }
  if (units.length === 0) return null;

  return {
    id: `off:${p.code}`,
    source: "off",
    name: p.product_name.trim(),
    brand: p.brands ? p.brands.split(",")[0].trim() : null,
    image: p.image_small_url ?? null,
    dataType: "Barcode",
    barcode: p.code,
    units,
  };
}

export async function lookupBarcode(
  barcode: string,
  signal?: AbortSignal,
): Promise<FoodItem | null> {
  const code = barcode.trim();
  if (!code) return null;
  const r = await fetch(`/api/foods/barcode/${encodeURIComponent(code)}`, {
    signal,
  });
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `HTTP ${r.status}`);
  }
  const data = (await r.json()) as { product?: OffProduct | null };
  if (!data.product) return null;
  return normalizeOff(data.product);
}
