-- Backfill columns that were added directly to the production database
-- outside the migration history. Without these, fresh databases (e.g.
-- Supabase preview branches) reject inserts coming from the onboarding
-- form because the columns don't exist.

alter table public.profiles
  add column if not exists fitness_experience text
    check (fitness_experience in ('beginner','intermediate','advanced'));

alter table public.profiles
  add column if not exists primary_goal text
    check (primary_goal in ('lose_fat','build_muscle','maintain','recomp'));
