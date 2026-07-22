-- OneBlock — migration 025: drop community_spots ("Spots your neighbors added").
--
-- The map-tab "Spots your neighbors added" feature has been replaced by the
-- Businesses section of the Discover tab. This drops its table (and, with
-- it, its RLS policies and grants) plus the moderate_delete_spot RPC.
--
-- Historical moderation_log rows with entity_type = 'community_spot' are
-- left in place, and 'community_spot' stays in the
-- moderation_log_entity_type_check constraint, so past board deletions
-- still render correctly in the HOA moderation feed.
--
-- Run this once in the Supabase SQL Editor, after migration_024.

drop function if exists public.moderate_delete_spot(uuid);

drop table if exists public.community_spots;
