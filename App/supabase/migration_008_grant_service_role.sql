-- OneBlock — migration 008: grant the service role real table access
--
-- Bug: every earlier migration's GRANT statements only ever targeted
-- `authenticated` (the role the mobile app's requests run as). The admin
-- dashboard connects with the Supabase *service role* key instead — a
-- different Postgres role. `service_role` has BYPASSRLS, which skips row
-- level security policies, but table-level GRANT/REVOKE is a separate, prior
-- check that BYPASSRLS does not skip. Since nothing ever granted
-- `service_role` SELECT/INSERT/UPDATE/DELETE, every admin-dashboard query —
-- starting with reading `communities`, which has RLS enabled but zero
-- policies by design — failed with "permission denied for table X".
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

grant select, insert, update, delete on all tables in schema public to service_role;

-- Covers tables any future migration adds, so this doesn't need to be
-- remembered by hand again.
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
