import { NextResponse } from "next/server";

// Barcode lookup goes through OpenFoodFacts — the only free open database
// indexed by GTIN/EAN/UPC. Browser fetch can't set User-Agent (forbidden
// header) and OFF rate-limits anonymous traffic, so we proxy server-side to
// attach a proper UA and to keep the request same-origin (Safari ITP otherwise
// flakes on cross-origin GETs).
const UA = "Kosmo-Fit/1.0 (contact@kosmosolutionsllc.net)";
const FIELDS =
  "code,product_name,brands,image_small_url,serving_size,serving_quantity,nutriments";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const trimmed = code.trim();
  // Valid EAN/UPC: 6 (UPC-E) to 14 digits.
  if (!trimmed || !/^\d{6,14}$/.test(trimmed)) {
    return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json?fields=${FIELDS}`;

  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (r.status === 404) {
      return NextResponse.json({ product: null });
    }
    if (!r.ok) {
      return NextResponse.json(
        { error: `OpenFoodFacts ${r.status}` },
        { status: 502 },
      );
    }
    const data = (await r.json()) as {
      status?: number;
      product?: unknown;
    };
    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ product: null });
    }
    return NextResponse.json(
      { product: data.product },
      // Barcodes are immutable, products change rarely — cache an hour.
      { headers: { "Cache-Control": "public, s-maxage=3600" } },
    );
  } catch (e) {
    const msg =
      e instanceof DOMException && e.name === "TimeoutError"
        ? "Barcode lookup timed out."
        : e instanceof Error
          ? e.message
          : "Upstream error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
