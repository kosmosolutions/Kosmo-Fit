// Shared cookie name for the user's IANA timezone. Lives in its own module
// (no next/headers import) so client components can use it without pulling
// server-only code into their bundle.
export const TZ_COOKIE = "tz";
