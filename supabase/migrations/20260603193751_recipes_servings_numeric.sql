-- Recipes can have fractional serving counts (e.g. 2.5), matching
-- food_entries.servings. The column was int, which rejected decimals.
alter table public.recipes
  alter column servings type numeric(6,2) using servings::numeric(6,2);
