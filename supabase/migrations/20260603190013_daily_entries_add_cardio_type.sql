-- Cardio activity type (treadmill, outdoor walk, bike, stationary, swim, …)
-- so the cardio log can store what the session was, drive a per-activity
-- calorie rate, and show the activity back on reopen.
alter table public.daily_entries
  add column if not exists cardio_type text;
