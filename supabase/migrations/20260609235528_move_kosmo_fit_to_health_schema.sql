-- Consolidate Kosmo apps under shared Supabase projects ("Kosmo Experience").
-- Move Kosmo Fit's tables out of `public` into a dedicated `health` schema.
create schema if not exists health;
grant usage on schema health to anon, authenticated, service_role;

-- Move the shared updated_at trigger fn first (triggers reference it by OID and follow).
alter function public.touch_updated_at() set schema health;

-- Move the six app tables. RLS policies, grants, triggers, FKs and indexes follow them.
alter table public.profiles               set schema health;
alter table public.daily_entries          set schema health;
alter table public.food_entries           set schema health;
alter table public.recipes                set schema health;
alter table public.workout_plans          set schema health;
alter table public.user_workout_exercises set schema health;

-- Expose `health` to PostgREST so supabase-js (db.schema = 'health') can reach it.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, health';
notify pgrst, 'reload config';
