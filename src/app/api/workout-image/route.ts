import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const runtime = "edge";

// Pexels image proxy for workout-plan card heroes. Keeps PEXELS_API_KEY
// server-side and returns a single landscape photo URL for a plan/template
// name. Mirrors /api/recipe-image — responses are cached hard at the edge
// since a given plan name always maps to the same query.
const PEXELS_API = "https://api.pexels.com/v1/search";
const PEXELS_KEY = process.env.PEXELS_API_KEY;

// Drop parentheticals and bias toward gym/training photography.
function queryFor(name: string) {
  const cleaned = name
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${cleaned} gym workout fitness`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  if (!PEXELS_KEY) {
    // No key configured — let the client fall back to the SVG motif hero.
    return NextResponse.json({ image: null });
  }

  try {
    const url = `${PEXELS_API}?per_page=1&orientation=landscape&query=${encodeURIComponent(queryFor(q))}`;
    const res = await fetch(url, {
      headers: { Authorization: PEXELS_KEY },
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
