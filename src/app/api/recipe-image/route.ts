import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// Pexels image proxy. Keeps PEXELS_API_KEY server-side and returns a single
// landscape photo URL for a recipe name. Used as the runtime fallback when a
// recipe has no `image` baked into recipe-catalog.json by the offline
// enrichment script. Responses are cached hard at the edge since a given
// recipe name always maps to the same query.
const PEXELS_API = "https://api.pexels.com/v1/search";
const PEXELS_KEY = process.env.PEXELS_API_KEY;

// Drop parentheticals so "Pasta (vegan, 30 min)" still queries cleanly, and
// bias toward plated-dish photos. Mirrors scripts/enrich-recipe-images.mjs.
function queryFor(name: string) {
  const cleaned = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned} food`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  if (!PEXELS_KEY) {
    // No key configured — let the client fall back to the emoji hero.
    return NextResponse.json({ image: null });
  }

  try {
    const url = `${PEXELS_API}?per_page=1&orientation=landscape&query=${encodeURIComponent(queryFor(q))}`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
      // Cache the upstream call for a day; the edge response below caches longer.
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ image: null });
    }
    const data = (await res.json()) as {
      photos?: Array<{ src?: { landscape?: string } }>;
    };
    const image = data.photos?.[0]?.src?.landscape ?? null;
    return NextResponse.json(
      { image },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=2592000, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json({ image: null });
  }
}
