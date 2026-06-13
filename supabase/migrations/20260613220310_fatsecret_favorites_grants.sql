-- Fix: FatSecret favorites writes failed with permission denied.
--
-- health.fatsecret_favorites was created directly in the `health` schema, which
-- has no default privileges for the API roles (unlike `public`, where Supabase
-- auto-grants on table creation — that's why the tables MOVED into health kept
-- working). RLS was enabled but no table-level grant existed, so PostgREST
-- (running as `authenticated`) was denied on every insert/select/delete. Grant
-- the needed privileges; RLS still gates rows to the owner.

grant select, insert, delete on table health.fatsecret_favorites to authenticated;
grant select, insert, delete on table health.fatsecret_favorites to service_role;

notify pgrst, 'reload schema';
