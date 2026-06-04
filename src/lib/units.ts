/**
 * Unit conversions. The database always stores base units — pounds for
 * weight, fluid ounces for water — and these helpers convert in/out
 * for display. Round-trip safe within ~1 decimal place.
 */

const LB_PER_KG = 2.20462262;
const FLOZ_PER_ML = 0.0338140227;
const CM_PER_IN = 2.54;

export type WeightUnit = "lb" | "kg";
export type WaterUnit = "oz" | "ml";
export type HeightUnit = "ftin" | "cm";

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function ozToMl(oz: number): number {
  return oz / FLOZ_PER_ML;
}

export function mlToOz(ml: number): number {
  return ml * FLOZ_PER_ML;
}

export function ftInToCm(ft: number, inch: number): number {
  return Math.round((ft * 12 + inch) * CM_PER_IN);
}

/** Convert cm to whole feet + inches, rolling 12" up to the next foot. */
export function cmToFtIn(cm: number): { ft: number; inch: number } {
  const totalIn = cm / CM_PER_IN;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
}

/** Show base-unit value in the user's chosen unit. */
export function formatWeight(lbs: number | null, unit: WeightUnit): string {
  if (lbs == null) return "—";
  const v = unit === "kg" ? lbToKg(lbs) : lbs;
  return v.toFixed(1);
}

export function formatWater(oz: number, unit: WaterUnit): string {
  const v = unit === "ml" ? Math.round(ozToMl(oz)) : oz;
  return v.toLocaleString();
}
