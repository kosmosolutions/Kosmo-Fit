-- Correct the favorites table into the `health` schema, where all Kosmo Fit
-- tables live (the previous migration mistakenly created it in `public`).
-- recipe_id is the only FatSecret data stored (storable indefinitely); content
-- is always re-fetched live.

drop table if exists public.fatsecret_favorites;

create table if not exists health.fatsecret_favorites (
  user_id    uuid not null references auth.users(id) on delete cascade,
  recipe_id  text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create index if not exists fatsecret_favorites_user_idx
  on health.fatsecret_favorites(user_id, created_at desc);

alter table health.fatsecret_favorites enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='health' and tablename='fatsecret_favorites' and policyname='own favorites select') then
    create policy "own favorites select" on health.fatsecret_favorites for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='health' and tablename='fatsecret_favorites' and policyname='own favorites insert') then
    create policy "own favorites insert" on health.fatsecret_favorites for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='health' and tablename='fatsecret_favorites' and policyname='own favorites delete') then
    create policy "own favorites delete" on health.fatsecret_favorites for delete using (auth.uid() = user_id);
  end if;
end $$;
