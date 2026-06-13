import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fatsecretConfigured, searchRecipes } from "@/lib/fatsecret";

// FatSecret recipe search proxy. Keeps the OAuth credentials server-side and
// returns flat per-serving result rows. Cached at the edge for up to an hour —
// well inside FatSecret's 24h re-request rule (recipe content is not storable
// beyond that), and enough to keep a typed query cheap.

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ recipes: [] });
  }
  if (!fatsecretConfigured()) {
    // No credentials — surface a clear, non-fatal state to the client so it can
    // keep the library-only experience.
    return NextResponse.json(
      { recipes: [], error: "not_configured" },
      { status: 200 },
    );
  }

  const page = Math.max(0, parseInt(req.nextUrl.searchParams.get("page") ?? "0", 10) || 0);

  try {
    const recipes = await searchRecipes(q, page);
    return NextResponse.json(
      { recipes },
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
