#!/usr/bin/env node
/**
 * Sync workout-card images into Supabase Storage.
 *
 * The set of card images is small and fixed — 8 stock templates + 12 focus
 * presets — so instead of calling Pexels on every page view we download each
 * photo ONCE, upload it to the public `card-images` Storage bucket, and write
 * the resulting public URLs into src/data/card-images.json. The app reads that
 * manifest and renders the image on first paint with no runtime API call.
 *
 * With --recipes it also re-hosts recipe photos: every Pexels URL baked into
 * public/recipe-catalog.json is downloaded and re-uploaded to Storage, and the
 * catalog's `image` is rewritten to the Storage URL — so recipes stop hitting
 * the Pexels CDN too.
 *
 * Resumable: skips keys already present in the manifest (and recipe images
 * already pointing at Storage), so it can be re-run after a Pexels rate limit.
 *
 * Usage:
 *   PEXELS_API_KEY=xxx \
 *   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=xxx \
 *   node scripts/sync-card-images.mjs [--recipes] [--force]
 */

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = path.join(__dirname, "..", "src", "data", "card-images.json");
const RECIPES = path.join(__dirname, "..", "public", "recipe-catalog.json");

const PEXELS_API = "https://api.pexels.com/v1/search";
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "card-images";

const args = process.argv.slice(2);
const DO_RECIPES = args.includes("--recipes");
const FORCE = args.includes("--force");

function requireEnv() {
  const missing = [];
  if (!PEXELS_KEY) missing.push("PEXELS_API_KEY");
  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SERVICE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    console.error(`Missing env: ${missing.join(", ")}`);
    process.exit(1);
  }
}

// Keep these query strings in sync with the route's queryFor() and the
// catalogs (src/data/workout-templates.ts, src/data/focus-presets.ts).
const TEMPLATES = [
  ["custom-6day", "Custom 6-Day"],
  ["fullbody-3day", "3-Day Full Body"],
  ["upperlower-4day", "4-Day Upper Lower"],
  ["ppl-upperlower-5day", "Push Pull Legs Upper Lower"],
  ["ppl-6day", "Push Pull Legs"],
  ["hiit-3day", "HIIT interval training"],
  ["compound-5x5", "Barbell strength training"],
  ["calisthenics-4day", "Calisthenics bodyweight"],
];

const FOCUS = [
  ["push", "Push chest shoulders triceps"],
  ["pull", "Pull back biceps"],
  ["legs", "Leg day squat"],
  ["upper", "Upper body training"],
  ["lower", "Lower body training"],
  ["full", "Full body workout"],
  ["chest", "Chest bench press"],
  ["back", "Back pull-up"],
  ["shoulders", "Shoulder press"],
  ["arms", "Arms biceps curl"],
  ["core", "Core abs workout"],
  ["cardio", "Cardio running"],
];

function queryFor(name) {
  const cleaned = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned} gym workout fitness`;
}

async function pexelsLandscape(query) {
  const url = `${PEXELS_API}?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_KEY } });
  if (res.status === 429) {
    console.error("Rate limited (429). Stopping; re-run later to resume.");
    process.exit(2);
  }
  if (!res.ok) throw new Error(`Pexels ${res.status} for "${query}"`);
  const data = await res.json();
  return data.photos?.[0]?.src?.landscape ?? null;
}

async function uploadFromUrl(objectPath, srcUrl) {
  const img = await fetch(srcUrl);
  if (!img.ok) throw new Error(`download ${img.status} for ${srcUrl}`);
  const bytes = Buffer.from(await img.arrayBuffer());
  const contentType = img.headers.get("content-type") || "image/jpeg";
  const dest = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`;
  const res = await fetch(dest, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: bytes,
  });
  if (!res.ok) {
    throw new Error(`upload ${res.status}: ${await res.text()}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

async function syncCards() {
  let manifest = {};
  try {
    manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    /* first run */
  }

  const jobs = [
    ...TEMPLATES.map(([id, q]) => [`templates/${id}`, q]),
    ...FOCUS.map(([key, q]) => [`focus/${key}`, q]),
  ];

  let updated = 0;
  for (const [key, q] of jobs) {
    if (manifest[key] && !FORCE) continue;
    try {
      const photo = await pexelsLandscape(queryFor(q));
      if (!photo) {
        console.log(`· no match: ${key}`);
        continue;
      }
      manifest[key] = await uploadFromUrl(`${key}.jpg`, photo);
      updated++;
      console.log(`✓ ${key}`);
    } catch (e) {
      console.error(`✗ ${key}: ${e.message}`);
    }
  }

  // Stable key order keeps the committed manifest diff-friendly.
  const sorted = Object.fromEntries(
    Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
  );
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`\nCards: ${updated} synced, ${Object.keys(sorted).length} total.`);
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function rehostRecipes() {
  const recipes = JSON.parse(await readFile(RECIPES, "utf8"));
  const storagePrefix = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/recipes/`;
  let updated = 0;
  for (const r of recipes) {
    if (!r.image) continue;
    if (r.image.startsWith(storagePrefix) && !FORCE) continue; // already hosted
    // Append the catalog id so same-named recipes (a few pairs exist) get
    // distinct, stable object paths.
    const slug = `${slugify(r.name) || "recipe"}-${r.id}`;
    try {
      r.image = await uploadFromUrl(`recipes/${slug}.jpg`, r.image);
      updated++;
      console.log(`✓ recipe ${r.name}`);
    } catch (e) {
      console.error(`✗ recipe ${r.name}: ${e.message}`);
    }
  }
  await writeFile(RECIPES, JSON.stringify(recipes, null, 2));
  console.log(`\nRecipes: ${updated} re-hosted, ${recipes.length} total.`);
}

async function main() {
  requireEnv();
  await syncCards();
  if (DO_RECIPES) await rehostRecipes();
}

main();
