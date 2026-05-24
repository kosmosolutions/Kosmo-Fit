-- Workout plan templates.
alter table public.profiles
  add column if not exists active_template_id text;

update public.profiles
   set active_template_id = 'custom-6day'
 where active_template_id is null
   and onboarded_at is not null;
