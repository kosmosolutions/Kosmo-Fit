"use client";

import { useEffect, useState } from "react";

/**
 * Persists a user's unit preference (weight, water, etc.) in
 * localStorage so popups remember the last choice across sessions.
 *
 * Reads happen client-side after hydration to avoid SSR mismatch —
 * the server always renders the default, then the effect updates if
 * a saved preference exists.
 */
export function useUnitPref<T extends string>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`unit:${key}`);
      if (stored) setValue(stored as T);
    } catch {
      // localStorage may be unavailable (Safari private mode, etc.)
    }
  }, [key]);

  function update(next: T) {
    setValue(next);
    try {
      window.localStorage.setItem(`unit:${key}`, next);
    } catch {
      // ignore
    }
  }

  return [value, update];
}
