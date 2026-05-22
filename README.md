# Kosmo Fitness

Your fitness OS: a SaaS-style personal workout, nutrition and self-care
tracker. Built with **Next.js 15 (App Router)** + **Supabase**, designed to
deploy to **Vercel**.

## Features

- **Overview** — daily target ring, macros, calendar of past entries,
  weight/steps/cardio/water/sleep/mood tracker, and a *gap-meter* that tells
  you how many minutes to walk (or steps to take, or cardio minutes to do)
  when you go over your calorie target for the day.
- **Diet** — meals split across breakfast / snack / lunch / dinner. Save any
  meal as a reusable recipe and one-tap log it next time.
- **Workout** — toggle between Home and Gym. Six-day split with a polished
  exercise list, sets, notes, EPOC flags, and a "Watch demo" button that
  opens YouTube for every exercise. (Set `youtubeId` per exercise in
  `src/data/workouts.ts` to embed a specific video inline.)
- **Profile / onboarding** — multi-step setup captures body, goals,
  timeframe, lifestyle, home-vs-gym preference, and step goal. Computes BMR,
  TDEE, daily deficit, per-day calorie targets, and macros.

## Tech stack

| Layer        | Choice                            |
|--------------|-----------------------------------|
| Framework    | Next.js 15 (App Router)           |
| UI           | Tailwind v3 + lucide-react        |
| Auth + DB    | Supabase (Postgres + RLS)         |
| Hosting      | Vercel                            |
| PWA          | manifest + theme color            |

## Setup

### 1. Install

```bash
pnpm install   # or `npm install`
```

### 2. Supabase

1. Create a project at <https://supabase.com>.
2. Open **SQL editor** → paste the contents of
   `supabase/migrations/001_init.sql` → run.
3. **Authentication → Providers** — enable Email/Password (and optionally
   Google or others). Disable "Confirm email" while developing if you want
   logins to work immediately.
4. **Project settings → API** — copy the project URL and `anon` public key.

### 3. Environment

Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-KEY
```

### 4. Run

```bash
pnpm dev
```

Open <http://localhost:3000>.

### 5. Deploy to Vercel

1. Push this repo to GitHub.
2. <https://vercel.com/new> → import → add the two env vars above.
3. Deploy. Add your Vercel preview/production URLs to Supabase
   **Authentication → URL Configuration → Site URL** so auth emails redirect
   correctly.

## Curating exercise videos

Each exercise in `src/data/workouts.ts` carries a `searchQuery` (always set)
and an optional `youtubeId`. When `youtubeId` is set the demo modal embeds
that exact video; otherwise the modal links out to a YouTube search for the
query. Edit the file to pin specific videos to specific exercises — nothing
else has to change.

## Calorie math (in one line)

```
daily target = LifeTDEE + today's workout burn − daily deficit
```

Net result is always the same deficit. The workout earns you more food. If
you go over your eat-target, the **gap-meter** on /overview tells you how
many minutes to walk (or cardio) to bring the day back to the target.

## License

Personal use.
