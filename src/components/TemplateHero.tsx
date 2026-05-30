"use client";

import { useEffect, useState } from "react";
import { Check, type LucideIcon } from "lucide-react";
import type { TemplateMotif } from "@/data/workout-templates";

interface Props {
  Icon: LucideIcon;
  motif: TemplateMotif;
  gradient: { from: string; to: string };
  name: string;
  tagline: string;
  active?: boolean;
  // A pre-synced Supabase Storage URL for this card (from card-images.json).
  // Renders on first paint with no runtime API call. Falls back to `query`
  // (runtime Pexels proxy) and then the SVG motif if absent or it fails.
  image?: string | null;
  // Runtime fallback: a Pexels photo for this query is fetched client-side
  // and rendered over the gradient. Used only when no baked `image` exists.
  query?: string;
}

// In-memory cache shared across every hero so a name resolves once per session.
// `null` means "looked up, no photo" so a known miss isn't retried. Mirrors
// the RecipeHero pattern.
const imageCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

function fetchWorkoutImage(query: string): Promise<string | null> {
  if (imageCache.has(query)) return Promise.resolve(imageCache.get(query)!);
  const existing = inflight.get(query);
  if (existing) return existing;
  const p = fetch(`/api/workout-image?q=${encodeURIComponent(query)}`)
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

/**
 * Layered hero for a workout-plan card. A themed gradient base, an optional
 * Pexels photo (when `query` resolves one), a decorative SVG motif fallback,
 * an oversized watermark icon, and a bottom scrim keeping the name/tagline
 * legible. Each template picks a `motif` matching its vibe (bolts for HIIT,
 * plates for 5×5, etc.).
 */
export function TemplateHero({
  Icon,
  motif,
  gradient,
  name,
  tagline,
  active,
  image,
  query,
}: Props) {
  const [proxyPhoto, setProxyPhoto] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  // A pre-synced Storage image wins and renders immediately. Only when there's
  // no usable baked image do we fall back to the runtime Pexels proxy.
  const baked = image && !errored ? image : null;

  useEffect(() => {
    setErrored(false);
  }, [image]);

  useEffect(() => {
    if (baked || !query) {
      setProxyPhoto(null);
      return;
    }
    let cancelled = false;
    fetchWorkoutImage(query).then((img) => {
      if (!cancelled) setProxyPhoto(img);
    });
    return () => {
      cancelled = true;
    };
  }, [baked, query]);

  const photo = baked ?? proxyPhoto;

  return (
    <div
      className="relative h-32 w-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
      }}
    >
      {photo && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt=""
            loading="lazy"
            onError={() => {
              if (baked) setErrored(true);
              else setProxyPhoto(null);
            }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 mix-blend-multiply"
            style={{
              background: `linear-gradient(135deg, ${gradient.from}cc, ${gradient.to}99)`,
            }}
          />
        </>
      )}

      {/* Soft depth blobs */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-36 w-36 rounded-full bg-black/30 blur-3xl" />

      {/* Decorative motif — fallback art when no photo resolved */}
      {!photo && (
        <svg
          viewBox="0 0 400 160"
          preserveAspectRatio="xMidYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden
        >
          <Motif motif={motif} />
        </svg>
      )}

      {/* Oversized watermark icon */}
      <Icon
        className="pointer-events-none absolute -bottom-3 -right-2 h-28 w-28 text-ink-950/15"
        strokeWidth={1.25}
      />

      {/* Bottom scrim for text legibility */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 to-transparent" />

      {/* Foreground icon chip */}
      <Icon
        className="absolute right-4 top-4 h-9 w-9 text-ink-950/80"
        strokeWidth={1.75}
      />

      {/* Title block */}
      <div className="absolute inset-x-0 bottom-0 p-4 text-ink-950">
        <div className="text-[10px] font-bold uppercase tracking-[3px] text-ink-950/75">
          {tagline}
        </div>
        <div className="mt-0.5 text-xl font-black leading-tight tracking-tight">
          {name}
        </div>
      </div>

      {active && (
        <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-ink-950/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-chalk-50">
          <Check className="h-3 w-3" />
          Active
        </div>
      )}
    </div>
  );
}

/** Per-motif decorative SVG, drawn in translucent ink + white. */
function Motif({ motif }: { motif: TemplateMotif }) {
  const ink = "rgba(8,11,16,0.10)";
  const light = "rgba(255,255,255,0.16)";

  switch (motif) {
    case "burst":
      return (
        <g stroke={light} strokeWidth="2" strokeLinecap="round">
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            const cx = 300;
            const cy = 60;
            return (
              <line
                key={i}
                x1={cx + Math.cos(a) * 18}
                y1={cy + Math.sin(a) * 18}
                x2={cx + Math.cos(a) * 52}
                y2={cy + Math.sin(a) * 52}
              />
            );
          })}
          <circle cx="300" cy="60" r="10" fill={light} stroke="none" />
          <circle cx="90" cy="120" r="40" fill="none" stroke={ink} strokeWidth="3" />
        </g>
      );

    case "grid":
      return (
        <g fill="none" stroke={light} strokeWidth="2">
          {Array.from({ length: 5 }).map((_, r) =>
            Array.from({ length: 11 }).map((_, c) => (
              <rect
                key={`${r}-${c}`}
                x={c * 40 - 10}
                y={r * 40 - 10}
                width="26"
                height="26"
                rx="5"
                opacity={(r + c) % 2 === 0 ? 0.9 : 0.4}
              />
            )),
          )}
        </g>
      );

    case "bolts":
      return (
        <g>
          <g stroke={light} strokeWidth="3" strokeLinecap="round">
            {Array.from({ length: 6 }).map((_, i) => (
              <line
                key={i}
                x1={-20 + i * 80}
                y1={-10}
                x2={-80 + i * 80}
                y2={170}
              />
            ))}
          </g>
          <polygon
            points="250,18 220,78 248,78 224,142 300,66 268,66 292,18"
            fill={ink}
          />
          <polygon
            points="120,30 100,72 118,72 102,118 150,64 128,64 146,30"
            fill={light}
          />
        </g>
      );

    case "waves":
      return (
        <g fill="none" stroke={light} strokeWidth="2.5" strokeLinecap="round">
          {Array.from({ length: 5 }).map((_, i) => (
            <path
              key={i}
              d={`M -20 ${30 + i * 28} q 70 -28 140 0 t 140 0 t 140 0`}
              opacity={0.4 + i * 0.12}
            />
          ))}
        </g>
      );

    case "rings":
      return (
        <g fill="none">
          {[60, 46, 32, 18].map((r, i) => (
            <circle
              key={r}
              cx="300"
              cy="70"
              r={r}
              stroke={i % 2 === 0 ? light : ink}
              strokeWidth="4"
            />
          ))}
          {[40, 26, 12].map((r, i) => (
            <circle
              key={`b-${r}`}
              cx="70"
              cy="130"
              r={r}
              stroke={i % 2 === 0 ? ink : light}
              strokeWidth="3"
            />
          ))}
        </g>
      );

    case "plates":
      return (
        <g>
          {/* Barbell sleeve with stacked plates */}
          <rect x="40" y="74" width="320" height="10" rx="5" fill={light} />
          {[
            { x: 70, h: 80 },
            { x: 92, h: 64 },
            { x: 110, h: 48 },
            { x: 290, h: 48 },
            { x: 308, h: 64 },
            { x: 330, h: 80 },
          ].map((p, i) => (
            <rect
              key={i}
              x={p.x}
              y={79 - p.h / 2}
              width="12"
              height={p.h}
              rx="4"
              fill={i % 2 === 0 ? ink : light}
            />
          ))}
        </g>
      );
  }
}
