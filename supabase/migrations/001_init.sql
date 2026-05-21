-- PocketCoach initial schema
-- Run in Supabase SQL editor or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles: one row per auth.users user
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  full_name      text,
  current_weight numeric(6,2) not null,
  goal_weight    numeric(6,2) not null,
  height_ft      int not null check (height_ft between 3 and 8),
  height_in      int not null check (height_in between 0 and 11),
  age            int not null check (age between 13 and 100),
  sex            text not null default 'male' check (sex in ('male','female','other')),
  lifestyle      text not null default 'desk' check (lifestyle in ('desk','light','active')),
  workout_mode   text not null default 'home' check (workout_mode in ('home','gym','both')),
  weeks_to_goal  int not null default 20 check (weeks_to_goal between 4 and 104),
  daily_step_goal int not null default 8000,
  notes          text,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- daily_entries: one row per (user, date) — the daily log
-- ─────────────────────────────────────────────────────────────────────────────
create table public.daily_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null,
  weight      numeric(6,2),
  steps       int default 0,
  cardio_minutes int default 0,
  cardio_calories int default 0,
  workout_completed boolean default false,
  workout_day_index int,
  workout_mode text check (workout_mode in ('home','gym')),
  mood        text check (mood in ('great','good','meh','bad')),
  water_oz    int default 0,
  sleep_hours numeric(3,1),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(user_id, entry_date)
);

create index daily_entries_user_date_idx on public.daily_entries(user_id, entry_date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- recipes: user-defined meals they can re-log quickly
-- ─────────────────────────────────────────────────────────────────────────────
create table public.recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  meal_type   text check (meal_type in ('breakfast','snack','lunch','dinner','any')),
  servings    int default 1,
  calories_per_serving int not null,
  protein_g   int not null default 0,
  carbs_g     int not null default 0,
  fat_g       int not null default 0,
  ingredients jsonb default '[]'::jsonb,
  instructions text,
  is_favorite boolean default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index recipes_user_idx on public.recipes(user_id, name);

-- ─────────────────────────────────────────────────────────────────────────────
-- food_entries: each meal logged on a given day
-- ─────────────────────────────────────────────────────────────────────────────
create table public.food_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  entry_date  date not null,
  meal_type   text not null check (meal_type in ('breakfast','snack','lunch','dinner')),
  name        text not null,
  servings    numeric(6,2) not null default 1,
  calories    int not null,
  protein_g   int not null default 0,
  carbs_g     int not null default 0,
  fat_g       int not null default 0,
  recipe_id   uuid references public.recipes(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index food_entries_user_date_idx on public.food_entries(user_id, entry_date desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger daily_entries_touch before update on public.daily_entries
  for each row execute function public.touch_updated_at();
create trigger recipes_touch before update on public.recipes
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security: a user can only see/edit their own rows
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles       enable row level security;
alter table public.daily_entries  enable row level security;
alter table public.recipes        enable row level security;
alter table public.food_entries   enable row level security;

create policy "own profile read"   on public.profiles      for select using (auth.uid() = user_id);
create policy "own profile write"  on public.profiles      for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.profiles      for update using (auth.uid() = user_id);

create policy "own entries read"   on public.daily_entries for select using (auth.uid() = user_id);
create policy "own entries write"  on public.daily_entries for insert with check (auth.uid() = user_id);
create policy "own entries update" on public.daily_entries for update using (auth.uid() = user_id);
create policy "own entries delete" on public.daily_entries for delete using (auth.uid() = user_id);

create policy "own recipes read"   on public.recipes       for select using (auth.uid() = user_id);
create policy "own recipes write"  on public.recipes       for insert with check (auth.uid() = user_id);
create policy "own recipes update" on public.recipes       for update using (auth.uid() = user_id);
create policy "own recipes delete" on public.recipes       for delete using (auth.uid() = user_id);

create policy "own food read"      on public.food_entries  for select using (auth.uid() = user_id);
create policy "own food write"     on public.food_entries  for insert with check (auth.uid() = user_id);
create policy "own food update"    on public.food_entries  for update using (auth.uid() = user_id);
create policy "own food delete"    on public.food_entries  for delete using (auth.uid() = user_id);
