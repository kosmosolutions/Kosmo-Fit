import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { fatsecretConfigured, getRecipe } from "@/lib/fatsecret";

// FatSecret recipe detail proxy (recipe.get). Returns totals shaped like the
// static CatalogRecipe so the dialog can render it with the same components.
// Cached <=1h at the edge (inside the 24h re-request rule).

export const runtime = "edge";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  if (!fatsecretConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const recipe = await getRecipe(id);
    return NextResponse.json(
      { recipe },
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
