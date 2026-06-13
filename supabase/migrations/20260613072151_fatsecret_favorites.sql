-- FatSecret recipe favorites.
--
-- FatSecret's API license forbids storing their recipe content beyond 24h, but
-- the recipe_id IS storable indefinitely. So a favorite is a bookmark by id
-- only: one row per (user, recipe_id). The recipe itself is always re-fetched
-- live from the API; no content is persisted here.
--
-- NOTE: this first cut created the table in `public`; the follow-up migration
-- 20260613072357_fatsecret_favorites_health_schema relocates it into `health`
-- (where all Kosmo Fit tables live). Kept as-is to match prod migration history.

create table if not exists public.fatsecret_favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists fatsecret_favorites_user_idx
  on public.fatsecret_favorites(user_id, created_at desc);

alter table public.fatsecret_favorites enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='fatsecret_favorites' and policyname='own favorites select') then
    create policy "own favorites select" on public.fatsecret_favorites for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='fatsecret_favorites' and policyname='own favorites insert') then
    create policy "own favorites insert" on public.fatsecret_favorites for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='fatsecret_favorites' and policyname='own favorites delete') then
    create policy "own favorites delete" on public.fatsecret_favorites for delete using (auth.uid() = user_id);
  end if;
end $$;
