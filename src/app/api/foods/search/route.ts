import { NextResponse } from "next/server";

// USDA FoodData Central name search. DEMO_KEY allows 30 requests per IP per
// hour — fine for local dev, but the Vercel edge IP is shared across all
// users, so production needs a real key from
// https://fdc.nal.usda.gov/api-key-signup.html (free, instant) wired into
// USDA_API_KEY.
const KEY = process.env.USDA_API_KEY || "DEMO_KEY";

// Include all four corpora. Foundation and SR Legacy hold the high-quality
// reference data (raw ingredients), Survey (FNDDS) covers prepared dishes,
// Branded covers packaged products.
const DATA_TYPES = ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"];

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ foods: [] });
  }

  const upstream = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  upstream.searchParams.set("api_key", KEY);
  upstream.searchParams.set("query", q);
  upstream.searchParams.set("pageSize", "20");
  for (const t of DATA_TYPES) {
    upstream.searchParams.append("dataType", t);
  }

  try {
    const r = await fetch(upstream.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 429) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again in a minute." },
        { status: 429 },
      );
    }
    if (!r.ok) {
      return NextResponse.json(
        { error: `USDA ${r.status}` },
        { status: 502 },
      );
    }
    const data = (await r.json()) as { foods?: unknown[] };
    return NextResponse.json(
      { foods: data.foods ?? [] },
      // 5 min edge cache — same query within that window doesn't burn quota.
      { headers: { "Cache-Control": "public, s-maxage=300" } },
    );
  } catch (e) {
    const msg =
      e instanceof DOMException && e.name === "TimeoutError"
        ? "Search timed out. Try a more specific term."
        : e instanceof Error
          ? e.message
          : "Upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
