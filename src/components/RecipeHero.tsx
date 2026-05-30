"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// Recipe visual: a photo over the category gradient, falling back to the
// category emoji. The photo comes from one of two places, in order:
//   1. `image` — a URL baked into recipe-catalog.json by the offline
//      enrichment script (scripts/enrich-recipe-images.mjs).
//   2. the /api/recipe-image proxy (Pexels, keyed on `query`) fetched at
//      runtime when no baked URL exists and PEXELS_API_KEY is set on the server.
// Plain <img> mirrors the existing food-image pattern so we don't need
// next/image remotePatterns config for the Pexels CDN.

// In-memory cache shared across every hero so a recipe name resolves once per
// session regardless of how many cards/detail views render it. `null` means
// "looked up, no photo" so we don't retry a known miss.
const imageCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function fetchRecipeImage(query: string): Promise<string | null> {
  if (imageCache.has(query)) return Promise.resolve(imageCache.get(query)!);
  const existing = inflight.get(query);
  if (existing) return existing;
  const p = fetch(`/api/recipe-image?q=${encodeURIComponent(query)}`)
    .then((r) => (r.ok ? r.json() : { image: null }))
    .then((d: { image?: string | null }) => {
      const img = d.image ?? null;
      imageCache.set(query, img);
      return img;
    })
    .catch(() => {
      imageCache.set(query, null);
      return null;
    })
    .finally(() => {
      inflight.delete(query);
    });
  inflight.set(query, p);
  return p;
}

export function RecipeHero({
  image,
  query,
  emoji,
  gradient,
  className,
  emojiClassName,
  children,
}: {
  image?: string | null;
  query?: string;
  emoji: string;
  gradient: string;
  className?: string;
  emojiClassName?: string;
  children?: React.ReactNode;
}) {
  // Baked URL wins; otherwise resolve via the proxy keyed on the recipe name.
  const [resolved, setResolved] = useState<string | null>(image ?? null);

  useEffect(() => {
    if (image) {
      setResolved(image);
      return;
    }
    if (!query) return;
    let cancelled = false;
    fetchRecipeImage(query).then((img) => {
      if (!cancelled) setResolved(img);
    });
    return () => {
      cancelled = true;
    };
  }, [image, query]);

  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden bg-gradient-to-br",
        gradient,
        className,
      )}
    >
      {resolved ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolved}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 to-transparent" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-ink-900/40" />
          <span className={cn("relative drop-shadow-lg", emojiClassName)}>
            {emoji}
          </span>
        </>
      )}
      {children}
    </div>
  );
}
