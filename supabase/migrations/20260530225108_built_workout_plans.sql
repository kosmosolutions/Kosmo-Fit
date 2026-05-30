-- "Create your own" built workout plans.
--
-- A built plan is a fully-custom program: the user picks which weekdays to
-- train and a focus per day, and we auto-fill exercises. Unlike snapshot
-- plans (which sit on a base template), a built plan carries its OWN day
-- layout in workout_plans.days and has no base template.
--
--   * workout_plans.is_built — true for builder-made plans.
--   * workout_plans.days     — jsonb array, one entry per training day:
--       { weekday: 0..6 (JS getDay, Sun=0), focus, icon, color, duration }.
--     NULL for snapshot plans, which fall back to base_template_id.
--   * base_template_id is now nullable (built plans have no base template).
--
-- The day_index check is widened to 0..6 so a built plan can schedule up to
-- seven training days (one per weekday).

alter table public.workout_plans
  add column if not exists is_built boolean not null default false;

alter table public.workout_plans
  add column if not exists days jsonb;

alter table public.workout_plans
  alter column base_template_id drop not null;

alter table public.user_workout_exercises
  drop constraint if exists user_workout_exercises_day_index_check;

alter table public.user_workout_exercises
  add constraint user_workout_exercises_day_index_check
    check (day_index >= 0 and day_index <= 6);
