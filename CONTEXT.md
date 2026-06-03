# Project: Kosmo Fitness

## Purpose
Personal fitness OS — SaaS-style workout, nutrition, self-care tracker. Daily target ring, macros, calendar, weight/steps/cardio/water/sleep/mood, gap-meter, diet logging w/ recipes, home/gym workouts w/ curated demo videos, multi-step onboarding (BMR/TDEE/deficit/macros).

## Tech Stack
- Next.js 15 (App Router) on Vercel
- Supabase (Postgres + RLS, Auth)
- Tailwind v3 + lucide-react
- pnpm
- PWA (manifest + theme color)

## Architecture / Key Decisions
- Server actions: `src/lib/actions/*`
- Components: `src/components/*`
- App routes: `src/app/(app)/*`
- DB tables: `profiles`, `daily_entries` (1 per user/date), `food_entries` (many per user/date), `recipes`, `workout_plans`
- Food search: USDA FoodData Central via `/api/foods/search` edge proxy; barcode via OpenFoodFacts `/api/foods/barcode/[code]` edge proxy (UA header + same-origin to dodge Safari ITP)
- Barcode scanner: `@zxing/browser`, lazy via `next/dynamic` from `AddMealDialog` (keeps ~100 kB out of `/diet` first-load)
- Card images self-hosted in Supabase Storage public bucket `card-images` (synced via `pnpm sync:images`); runtime `/api/workout-image` + `/api/recipe-image` Pexels proxies = fallback only
- Plan model: stock templates + saved plans + built (create-your-own) plans; `workout_plans.is_built` + `days` jsonb; plan-scoped customizations via `resolveContext()`
- Calorie math: `daily target = LifeTDEE + workout burn − deficit`; per-template burn via `estimateSessionBurn()`; legacy BURNS table only for custom-6day
- Macro split: `profiles.macro_(protein|carb|fat)_pct` overrides; fallback = 0.9 g/lb + 27% fat; DB check constraint sum=100
- Shared workout-plan types in `src/lib/workout-plan-types.ts` (`"use server"` files can only export async fns)

## Current State
- Branch: `main` (clean, up to date)
- Last commit: `3550140 feat(design): Apple Fitness-inspired bento redesign (#50)`
- Open PR: [#49 Live FatSecret recipe search in Add Meal dialog](https://github.com/kosmosolutions/Kosmo-Fit/pull/49) — DRAFT, branch `claude/fatsecret-recipe-search`
- Roadmap (CLAUDE.md): backlog empty
- Vercel: linked (deployments via MCP)

## Known Gotchas
- **Supabase migrations**: `apply_migration` MCP stamps its OWN timestamp version. After applying, run `list_migrations` and rename committed file to `supabase/migrations/<recorded_version>_<name>.sql` EXACTLY — mismatch → `MIGRATIONS_FAILED` on prod (fixed twice: #30, #39)
- Sandbox git proxy blocks `git push --delete` (403); no MCP delete-branch tool — stale branches pile up. Real fix: repo setting "Automatically delete head branches"
- `apply_migration` goes directly to remote — prefer local dev workflow first
- USDA `/api/foods/search` falls back to `DEMO_KEY` (30 req/hr per IP) if `USDA_API_KEY` unset on Vercel
- Card images: must run `pnpm sync:images` once or manifest empty (motif fallback only)
- Diet `AddMealDialog`: viewport `interactiveWidget = "resizes-content"` (root `layout.tsx`) — keyboard shrinks viewport instead of overlapping
- No `autoFocus` on dialog inputs (pops keyboard on tab switch)

## Recent Changes
- #50 — Apple Fitness-inspired bento redesign
- #48 — Create-your-own programs (`PlanBuilder`, focus presets, `workout_plans.is_built`+`days`) + Pexels plan & recipe photos sync (`scripts/sync-card-images.mjs` → Supabase Storage `card-images`)
- #47 — Diet recipes in `AddMealDialog` + mobile keyboard fixes
- #46 — Profile redesign (identity header, deficit-based target, overview log tiles)
- #45 — Workout page restructure + scrollable exercise detail popup
- #44 — Diet restructure (scoreboard + meal timeline)
- #42 — Overview hero/steps polish + calendar consistency stats
- #41 — Floating pill bottom tab bar
- #40 — Landing redesign
- #39 — Migration filename realign
- #38 — Saved custom workout plans (`workout_plans` table, plan-scoped customizations, plan library in `PlanPicker`)

## Conventions
- Squash merge to `main`; PR titles end with `(#NN)`
- Branches: `claude/<short-slug>` (repo legacy; conflicts w/ global `feature/bug/chore/` rule)
- No emoji in code or commits unless asked
- No backwards-compat shims for removed code
- Comments only when *why* is non-obvious
- Test plan checklist in every PR body
- Project context lives in BOTH `CLAUDE.md` (roadmap + shipped log) and `CONTEXT.md` (this file: shape + gotchas + current state)
