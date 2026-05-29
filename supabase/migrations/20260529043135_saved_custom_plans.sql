-- Multiple saved custom workout plans (a plan library).
--
-- Model:
--   * workout_plans          — one row per saved custom plan.
--   * user_workout_exercises.plan_id — NULL = the scratch working copy
--     tied to the active stock template (preserves all prior behavior);
--     a uuid = exercises belonging to that saved plan.
--   * profiles.active_plan_id — NULL = on a stock template (scratch);
--     a uuid = on that saved plan.
--
-- The new columns are nullable so existing rows/users are unchanged.

create table if not exists public.workout_plans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  name             text not null,
  base_template_id text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists workout_plans_user_idx
  on public.workout_plans(user_id, created_at);

alter table public.workout_plans enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workout_plans' and policyname='own plans select') then
    create policy "own plans select" on public.workout_plans for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workout_plans' and policyname='own plans insert') then
    create policy "own plans insert" on public.workout_plans for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workout_plans' and policyname='own plans update') then
    create policy "own plans update" on public.workout_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workout_plans' and policyname='own plans delete') then
    create policy "own plans delete" on public.workout_plans for delete using (auth.uid() = user_id);
  end if;
end $$;

create or replace trigger workout_plans_touch before update on public.workout_plans
  for each row execute function public.touch_updated_at();

alter table public.user_workout_exercises
  add column if not exists plan_id uuid references public.workout_plans(id) on delete cascade;

create index if not exists user_workout_exercises_plan_idx
  on public.user_workout_exercises(user_id, plan_id, mode, day_index, position);

alter table public.profiles
  add column if not exists active_plan_id uuid references public.workout_plans(id) on delete set null;
