# Claude memory — Kosmo Fitness

Context for future Claude Code sessions on this repo. Keep brief. Update when scope shifts.

## Roadmap (next up, in order)

1. **Workout plan templates** — pick from 3 / 4 / 5 / 6-day presets plus **Custom** (keep the user's existing plan under Custom, do not delete it) with editable day count. Also include industry-standard programs as templates: **HIIT**, **Compound (5×5)**, **Push/Pull/Legs**, **Calisthenics**. Surface a polished selection card the first time a user signs in, and keep a "Change plan" button in the workout tab so they can switch any time. Visual target: Apple Fitness-style aesthetic for the template cards. Open question: how to present per-program GIFs cleanly (per-exercise GIFs already work; need to figure out hero imagery for the program itself).
2. **Weight trend chart** on profile + overview. ~half a day.
3. **Macro % override** on profile (let users override the protein / carb / fat split rather than only goals). ~2 hours.
4. **Day navigator** on the overview "today" header — left/right arrows to step previous / next day. Pairs naturally with the calendar's `?date=…` flow already wired up.
5. **Finish-workout button in /workout** — wire it to the same `workout_completed` flag the overview Finish button toggles, so marking complete from either screen syncs. **Dynamic cardio entry**: tap to log either in **minutes** or **calories**; auto-derive the other (approximate) and write both to the daily entry.
6. **Daily tracker redesign** — replace inline inputs in the "Log today" section with per-metric popups. Each popup should support a **unit toggle** (e.g. kg ↔ lb for weight, mi ↔ km for cardio distance, oz ↔ ml for water).

## Project shape

- Next.js 15 (App Router) on Vercel · Supabase auth + Postgres · Tailwind · pnpm.
- Server actions live under `src/lib/actions/*`. Components in `src/components/*`. App routes in `src/app/(app)/*`.
- DB tables: `profiles`, `daily_entries` (one per user-per-date), `food_entries` (many per user-per-date), `recipes`, `workout_plans`.

## Food data sources (PR #27 follow-up)

- **Name search** → USDA FoodData Central via `/api/foods/search` (edge proxy).
  - Needs `USDA_API_KEY` env var on Vercel. Falls back to `DEMO_KEY` (30 req/hr shared per IP).
  - Sign up: <https://fdc.nal.usda.gov/api-key-signup.html> (free, instant).
- **Barcode lookup** → OpenFoodFacts via `/api/foods/barcode/[code]` (edge proxy).
  - Proxy attaches a proper `User-Agent` (browser fetch can't) and keeps the request same-origin so Safari ITP doesn't flake on it.
- Unified `FoodItem` / `FoodUnit` shape in `src/lib/foods.ts`. Source distinction only surfaces as a chip on the result row ("Whole" / "Branded" / "Barcode").
- Barcode scanner = `@zxing/browser` (EAN + UPC only). Lazy-loaded via `next/dynamic` from `AddMealDialog` so the ~100 kB zxing bundle never enters the `/diet` first-load.

## Calendar (PR #28 follow-up)

- Month grid with year dropdown (last 10 years). Dual-track marking: cyan dot = diet logged, violet dot = workout completed.
- Lazy per-year fetch via `getActivityYear` server action (`src/lib/actions/activity.ts`); client caches each fetched year so flipping between months in the same year is instant.
- A previous attempt swapped the month grid for a GitHub-style year heatmap (PR #28 first commit) — the user preferred the original month-grid look, so it was reverted.

## Conventions

- Squash merge to `main`; PR titles end with `(#NN)`.
- Branches: `claude/<short-slug>`.
- No emoji in code or commits unless the user asks.
- No backwards-compat shims for removed code — just delete it.
- Comments only when the *why* is non-obvious. Don't restate what the code does.
- Test plan in every PR body as a checklist.
