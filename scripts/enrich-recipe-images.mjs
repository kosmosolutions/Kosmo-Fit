#!/usr/bin/env node
// One-time enrichment: attach a Pexels photo URL to each recipe in
// public/recipe-catalog.json, keyed on the recipe name.
//
// Usage:
//   PEXELS_API_KEY=xxxxx node scripts/enrich-recipe-images.mjs
//
// Get a free key at https://www.pexels.com/api/ (200 req/hr, 20k/month).
// The catalog has ~232 recipes, which exceeds the hourly cap — the script is
// resumable: it skips recipes that already have an `image`, saves progress as
// it goes, and exits cleanly on a rate-limit (429) so you can re-run later.
//
// Flags:
//   --force   re-fetch images even for recipes that already have one
//   --limit N stop after writing N images this run

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = join(__dirname, "..", "public", "recipe-catalog.json");

const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
  console.error("Missing PEXELS_API_KEY. Get one at https://www.pexels.com/api/");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Drop parentheticals and trailing qualifiers so "Pasta (vegan, 30 min)" still
// queries cleanly. Append "food" to bias Pexels toward plated-dish photos.
function queryFor(name) {
  const cleaned = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned} food`;
}

async function fetchImage(name) {
  const url =
    "https://api.pexels.com/v1/search?per_page=1&orientation=landscape&query=" +
    encodeURIComponent(queryFor(name));
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (res.status === 429) return { rateLimited: true };
  if (!res.ok) throw new Error(`Pexels ${res.status} for "${name}"`);
  const data = await res.json();
  const photo = data.photos?.[0];
  return { image: photo?.src?.landscape ?? null };
}

async function main() {
  const recipes = JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  let written = 0;
  let scanned = 0;

  for (const recipe of recipes) {
    if (!force && recipe.image) continue;
    if (written >= limit) break;
    scanned++;

    try {
      const { image, rateLimited } = await fetchImage(recipe.name);
      if (rateLimited) {
        console.warn("Rate limited by Pexels — saving progress and stopping.");
        break;
      }
      recipe.image = image;
      if (image) {
        written++;
        console.log(`✓ ${recipe.name}`);
      } else {
        console.log(`· no match: ${recipe.name}`);
      }
    } catch (err) {
      console.warn(`! ${recipe.name}: ${err.message}`);
    }

    // Persist every 10 lookups so a crash/rate-limit never loses work.
    if (scanned % 10 === 0) {
      await writeFile(CATALOG_PATH, JSON.stringify(recipes, null, 2) + "\n");
    }
    await sleep(250);
  }

  await writeFile(CATALOG_PATH, JSON.stringify(recipes, null, 2) + "\n");
  const withImage = recipes.filter((r) => r.image).length;
  console.log(
    `\nDone. ${written} new this run · ${withImage}/${recipes.length} recipes now have an image.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
