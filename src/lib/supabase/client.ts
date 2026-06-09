import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Kosmo Fit's tables live in the `health` schema of the shared
    // "Kosmo Experience" project, not `public`.
    { db: { schema: "health" } },
  );
}
