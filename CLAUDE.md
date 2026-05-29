# Claude memory — Kosmo Fitness

Context for future Claude Code sessions on this repo. Keep brief. Update when scope shifts.

## Roadmap (next up, in order)

_Empty — backlog cleared. Add the next batch here when scope is set. Deferred polish: multiple saved custom workout plans; Canva-generated photography for template heroes (programmatic SVG art shipped in #36; Canva blocked by sandbox network policy)._

## Shipped (recent)

- **Workout plan templates** (#29) — 8-program catalog (Custom 6-Day, 3/4/5/6-day splits, HIIT, Compound 5×5, Calisthenics) with auto-opening picker for new users + "Change plan" button. `profiles.active_template_id` drives default exercises; switching wipes customizations. Canva hero imagery deferred — cards use bold gradient + icon for now.
- **Migration history cleanup** (#30) — repo's migration files realigned to timestamp format to match prod's `supabase_migrations.schema_migrations`. Resolves long-standing `MIGRATIONS_FAILED` state on main.
- **Finish-workout button + dynamic cardio** (#31) — `MarkCompleteToggle` pill stacks under the SessionTimer; flips the same `workout_completed` flag the overview toggle writes. `CardioLogPopup` accepts minutes OR calories and auto-derives the other using `walkingCalPerMin(weight) * 2.2`.
- **Weight trend chart** (#32) — `WeightTrendChart` SVG line + area on overview (under GapMeter) and profile (under Live summary). Reads from `daily_entries.weight` via `getWeightHistory()`. Goal weight rendered as a dashed reference line; trend chip color follows whether user is cutting/bulking.
- **Macro % override** (#33) — new `Macros` section on profile lets users pick a custom P/C/F split via preset chips (Balanced, High-protein, Low-carb, Keto) or freeform percentage inputs. `profiles.macro_(protein|carb|fat)_pct` columns hold the override; `calcStats` falls back to the legacy 0.9 g/lb + 27% fat heuristic when null. DB check constraint enforces sum=100.
- **Day navigator** (#34) — left/right `DayNavLink` chips flank the overview's date heading; next is disabled when viewing today. "Jump to today" pill appears under the chip row when off-today. All writes through `?date=…`, reusing the existing calendar URL flow.
- **Daily tracker redesign** (#35) — "Log today" inline inputs replaced with tappable `MetricCard`s that open per-metric popups (`MetricPopups.tsx` + shared `Shell`). Weight (kg↔lb) and Water (oz↔ml) have unit toggles; cardio reuses `CardioLogPopup`. Unit prefs persist via `useUnitPref` (localStorage). Conversions in `src/lib/units.ts` — DB still stores base units (lb, oz). Mood + workout-complete stay inline toggles.
- **Template hero art** (#36) — `TemplateHero` renders layered programmatic SVG per template (themed gradient + one of 6 motifs: burst/grid/waves/rings/bolts/plates + watermark icon + scrim). Replaces the plain gradient hero in `PlanPicker`. Canva was blocked by the sandbox network policy, so this ships self-contained vector art.
- **Per-template calorie targets** (#37) — the calorie banner no longer uses the hard-coded 6-slot BURNS table for template plans. `estimateSessionBurn()` (calc.ts) derives each day's burn from duration + focus (~7 cal/min strength, ~11 for intervals); rest days fall to `restTarget`. Legacy/custom-6day keeps the hand-tuned positional BURNS. Banner burn now updates per selected day (also fixed a stale-burn display bug).

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
