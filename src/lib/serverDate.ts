// Server-side "today" in the *user's* local timezone.
//
// Server components run on Vercel in UTC, so `new Date()` there is UTC — at
// night in the Americas that rolls the date forward and the app shows
// "tomorrow" as today. The browser writes its IANA timezone into the `tz`
// cookie (see TimezoneSync); we read it here to compute the real local date.

import { cookies } from "next/headers";
import { TZ_COOKIE } from "@/lib/tz";

/** User's IANA timezone from the cookie, or null before the client syncs it. */
export async function getUserTimezone(): Promise<string | null> {
  const store = await cookies();
  const tz = store.get(TZ_COOKIE)?.value;
  return tz && tz.length > 0 ? tz : null;
}

/** Format a Date as YYYY-MM-DD in the given IANA timezone (server local if null). */
export function formatInTz(d: Date, tz: string | null): string {
  try {
    // en-CA renders as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz ?? undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  }
}

/** Today's date (YYYY-MM-DD) in the user's local timezone. */
export async function localTodayISO(): Promise<string> {
  return formatInTz(new Date(), await getUserTimezone());
}
