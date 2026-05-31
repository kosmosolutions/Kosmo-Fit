import manifest from "@/data/card-images.json";

// Maps a card key → a Supabase Storage public URL, populated by
// scripts/sync-card-images.mjs (which downloads each Pexels photo once and
// uploads it to the `card-images` bucket). Reading from here means cards
// render their image on first paint with no runtime API call.
//
// Keys:
//   templates/<templateId>   — stock workout-template card
//   focus/<focusKey>         — a focus preset (used by built/custom plan cards)
const CARD_IMAGES = manifest as Record<string, string>;

/** Resolve a card key to its synced Storage URL, or null if not synced yet. */
export function cardImageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return CARD_IMAGES[key] ?? null;
}

export function templateImage(templateId: string): string | null {
  return cardImageUrl(`templates/${templateId}`);
}

export function focusImage(focusKey: string): string | null {
  return cardImageUrl(`focus/${focusKey}`);
}
