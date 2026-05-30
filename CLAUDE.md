# Claude memory — Kosmo Fitness

Context for future Claude Code sessions on this repo. Keep brief. Update when scope shifts.

## Roadmap (next up, in order)

_Empty — backlog cleared. Add the next batch here when scope is set._

## Shipped (recent)

- **Create-your-own programs + plan photos** — "Create your own program" replaces "Save current as a plan" in `PlanPicker`. New `PlanBuilder` lets users name a program, toggle any of the 7 weekdays as training days, and pick a focus per day (`FOCUS_PRESETS` in `src/data/focus-presets.ts`: Push/Pull/Legs/Upper/Lower/Full + per-muscle + Cardio); on create it auto-fills a balanced exercise set per day for BOTH home & gym from `/exercise-catalog.json` (`pickExercisesForFocus`, home filtered to no-gym equipment) and persists a "built" plan. New migration `built_workout_plans`: `workout_plans.is_built` + `workout_plans.days` jsonb (its own day layout — `{weekday,focus,icon,color,duration}`), `base_template_id` made nullable, `user_workout_exercises.day_index` check widened 0–5 → 0–6. `createBuiltPlan` action seeds plan-scoped rows; `resolveContext` returns `isBuilt`/`builtDays`; built days skip the template-fork path. Workout page resolves a built plan's own day layout + defaults the picker to today's matching weekday; calorie banner prices built/template days via `estimateSessionBurn` (never the legacy BURNS table). `TemplateHero` gained a `query` prop → Pexels photo over the gradient (SVG motif fallback) via new `/api/workout-image` edge proxy (mirrors `/api/recipe-image`, `PEXELS_API_KEY`); applied to stock templates AND custom/built plan cards. Shared plan types live in `src/lib/workout-plan-types.ts` (the `"use server"` action file can only export async fns). **Card images are self-hosted in Supabase Storage** (public bucket `card-images`): `scripts/sync-card-images.mjs` (`pnpm sync:images`, needs `PEXELS_API_KEY` + `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`) downloads each Pexels photo once and uploads it (8 templates → `templates/<id>.jpg`, 12 focus presets → `focus/<key>.jpg`), writing the public URLs to `src/data/card-images.json`. `TemplateHero` takes an `image` prop (resolved via `cardImageUrl`/`templateImage`/`focusImage` in `src/lib/cardImages.ts`) → renders on first paint with no API call; built-plan cards use their dominant focus's image (`dominantFocusKey`). The `/api/workout-image` runtime proxy is now only a fallback for unsynced keys. `--recipes` flag re-hosts recipe photos into `card-images/recipes/<slug>.jpg` (rewrites `recipe-catalog.json` `image`) so recipes leave the Pexels CDN too. Must run the sync once for images to appear (manifest ships empty → motif fallback until then).
- **Workout plan templates** (#29) — 8-program catalog (Custom 6-Day, 3/4/5/6-day splits, HIIT, Compound 5×5, Calisthenics) with auto-opening picker for new users + "Change plan" button. `profiles.active_template_id` drives default exercises; switching wipes customizations. Canva hero imagery deferred — cards use bold gradient + icon for now.
- **Migration history cleanup** (#30) — repo's migration files realigned to timestamp format to match prod's `supabase_migrations.schema_migrations`. Resolves long-standing `MIGRATIONS_FAILED` state on main.
- **Finish-workout button + dynamic cardio** (#31) — `MarkCompleteToggle` pill stacks under the SessionTimer; flips the same `workout_completed` flag the overview toggle writes. `CardioLogPopup` accepts minutes OR calories and auto-derives the other using `walkingCalPerMin(weight) * 2.2`.
- **Weight trend chart** (#32) — `WeightTrendChart` SVG line + area on overview (under GapMeter) and profile (under Live summary). Reads from `daily_entries.weight` via `getWeightHistory()`. Goal weight rendered as a dashed reference line; trend chip color follows whether user is cutting/bulking.
- **Macro % override** (#33) — new `Macros` section on profile lets users pick a custom P/C/F split via preset chips (Balanced, High-protein, Low-carb, Keto) or freeform percentage inputs. `profiles.macro_(protein|carb|fat)_pct` columns hold the override; `calcStats` falls back to the legacy 0.9 g/lb + 27% fat heuristic when null. DB check constraint enforces sum=100.
- **Day navigator** (#34) — left/right `DayNavLink` chips flank the overview's date heading; next is disabled when viewing today. "Jump to today" pill appears under the chip row when off-today. All writes through `?date=…`, reusing the existing calendar URL flow.
- **Daily tracker redesign** (#35) — "Log today" inline inputs replaced with tappable `MetricCard`s that open per-metric popups (`MetricPopups.tsx` + shared `Shell`). Weight (kg↔lb) and Water (oz↔ml) have unit toggles; cardio reuses `CardioLogPopup`. Unit prefs persist via `useUnitPref` (localStorage). Conversions in `src/lib/units.ts` — DB still stores base units (lb, oz). Mood + workout-complete stay inline toggles.
- **Template hero art** (#36) — `TemplateHero` renders layered programmatic SVG per template (themed gradient + one of 6 motifs: burst/grid/waves/rings/bolts/plates + watermark icon + scrim). Replaces the plain gradient hero in `PlanPicker`. Canva was blocked by the sandbox network policy, so this ships self-contained vector art.
- **Per-template calorie targets** (#37) — the calorie banner no longer uses the hard-coded 6-slot BURNS table for template plans. `estimateSessionBurn()` (calc.ts) derives each day's burn from duration + focus (~7 cal/min strength, ~11 for intervals); rest days fall to `restTarget`. Legacy/custom-6day keeps the hand-tuned positional BURNS. Banner burn now updates per selected day (also fixed a stale-burn display bug).
- **Saved custom workout plans** (#38) — a plan library. New `workout_plans` table; `user_workout_exercises.plan_id` (NULL = scratch working copy on a stock template = prior behavior; uuid = a saved plan); `profiles.active_plan_id`. Every customization action in `workout-plan.ts` is plan-scoped via `resolveContext()`. New actions: `createPlanFromCurrent` (COPY snapshot of both modes), `applyPlan`, `deletePlan`, `renamePlan`, `getUserPlans`. PlanPicker gained a "Your plans" section + "Save current as a plan" + rename/delete; saved-plan cards reuse `TemplateHero` via their base template. `applyTemplate` now wipes only the scratch copy, never saved plans. Page resolves an `effectiveTemplateId` (plan's base when on a plan) for day layout + calorie banner.
- **Migration filename realign** (#39) — `apply_migration` stamps its own version; committed file renamed to match prod's recorded version to clear `MIGRATIONS_FAILED`.
- **Landing redesign** (#40) — de-noised hero, cleaner first screen.
- **Floating tab bar** (#41) — floating pill bottom tab bar for app nav.
- **Overview restyle** (#42) — hero/steps polish + calendar consistency stats.
- **Diet restructure** (#44) — page IA reorganized (not just restyled). Recipe library link moves into the header as a compact pill; the calorie Ring hero becomes a horizontal scoreboard (big total + full-width consumed/target meter, amber overflow when over target); macros switch from a 3-up pill grid to stacked horizontal meters; a top-level primary "Log food" CTA defaults to the next empty meal; the four meal cards become a connected vertical day timeline. `AddMealDialog` gained optional `triggerLabel` + `triggerVariant` ("chip" | "primary") props. Superseded the polish-only PR #43 (closed unmerged).
- **Diet recipes + mobile fixes** (#47) — `AddMealDialog` is now full-screen on mobile (centered card on desktop) with a fixed header (title/meal/tabs) + single scrollable body; paired with `viewport.interactiveWidget = "resizes-content"` (root `layout.tsx`) so the keyboard shrinks the viewport instead of overlapping. The in-dialog recipe detail now mirrors the library (hero, tags, full ingredients + instructions, source) with servings/Log/Save kept above the recipe text, plus a "Save to my recipes" button (reuses `saveCatalogRecipe`). Recipe photos via `RecipeHero`: baked `image` in `recipe-catalog.json` (from `scripts/enrich-recipe-images.mjs` / `pnpm enrich:images`, resumable Pexels lookup) → runtime `/api/recipe-image` edge proxy (Pexels, `PEXELS_API_KEY` env on Vercel, edge-cached, in-memory de-dupe per session) → emoji/gradient fallback. Catalog shape + helpers extracted to `src/lib/recipeCatalog.ts` (shared by library browser + dialog). Diet-page Recipes link restyled as a prominent cyan pill. Removed `autoFocus` from dialog inputs (was popping the keyboard on tab switch); dialog body scroll resets to top on view switch.

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
- Branches: `claude/<short-slug>`. Delete the branch after its PR merges. The
  sandbox git proxy blocks `git push --delete` (403) and no MCP delete-branch
  tool exists, so the real fix is the repo setting **"Automatically delete head
  branches"** (Settings → Pull Requests). Until that's on, branches pile up
  (~34 stale ones as of #45) and must be deleted from the GitHub UI.
- No emoji in code or commits unless the user asks.
- No backwards-compat shims for removed code — just delete it.
- Comments only when the *why* is non-obvious. Don't restate what the code does.
- Test plan in every PR body as a checklist.
- **Migrations**: `apply_migration` (Supabase MCP) stamps its OWN timestamp version, which won't match a hand-named file. After applying, run `list_migrations` and name the committed file `supabase/migrations/<recorded_version>_<name>.sql` EXACTLY. A mismatch puts the main-branch Supabase action into `MIGRATIONS_FAILED` ("Remote migration versions not found in local migrations directory"). Fixed twice now (#30, #39).
