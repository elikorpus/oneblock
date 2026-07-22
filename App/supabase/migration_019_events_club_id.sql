-- OneBlock — migration 019: tie an event to a specific club (optional)
--
-- Events can now optionally belong to a club — "make something general or
-- for a specific club that already exists." Nullable, so every existing
-- event, and every general/neighborhood-wide event going forward, is
-- unaffected.
--
-- Run this once in the Supabase SQL Editor, after schema.sql. Safe to re-run.

alter table public.events add column if not exists club_id uuid references public.clubs (id) on delete set null;
