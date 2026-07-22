-- OneBlock — migration 023: let board members actually read the moderation log.
--
-- moderation_log has had a row-level policy since migration_007
-- ("moderation_log_select_board_only") but the `authenticated` role was never
-- granted table-level SELECT, so every read failed with
--   42501: permission denied for table moderation_log
-- and the HOA → Board tools panel always rendered "Nothing's been removed yet."
--
-- Run this once in the Supabase SQL Editor.

grant select on public.moderation_log to authenticated;
