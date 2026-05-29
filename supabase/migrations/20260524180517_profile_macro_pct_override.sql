-- Macro % override. Lets the user set their own protein/carb/fat split
-- on profile rather than relying on the calc default (0.9 g/lb protein,
-- 27% fat from calories, carbs as the residual).
--
-- All three columns are nullable. When ALL are null, calcStats() falls
-- back to the legacy formula — so existing users see no change. When
-- ALL are set, they're used directly.
--
-- A row-level check enforces that the values sum to 100 when populated.

alter table public.profiles
  add column if not exists macro_protein_pct int
    check (macro_protein_pct between 5 and 80),
  add column if not exists macro_carb_pct int
    check (macro_carb_pct between 5 and 80),
  add column if not exists macro_fat_pct int
    check (macro_fat_pct between 10 and 70);

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'profiles_macro_pct_sum'
  ) then
    alter table public.profiles
      add constraint profiles_macro_pct_sum
      check (
        (macro_protein_pct is null
          and macro_carb_pct is null
          and macro_fat_pct is null)
        or (
          macro_protein_pct is not null
          and macro_carb_pct is not null
          and macro_fat_pct is not null
          and macro_protein_pct + macro_carb_pct + macro_fat_pct = 100
        )
      );
  end if;
end $$;
