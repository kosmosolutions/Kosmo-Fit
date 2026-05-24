alter table public.profiles
  add column if not exists fitness_experience text check (fitness_experience in ('beginner','intermediate','advanced')),
  add column if not exists primary_goal text check (primary_goal in ('lose_fat','build_muscle','maintain','recomp'));
