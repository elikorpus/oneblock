-- Neighborly — migration 010: let HOA board members post a fine for the community to vote on
--
-- Bug: public.fines had a select policy only — nothing, not even the board, could
-- ever insert a new one through the app. The "Vote" tab could only ever show
-- fines seeded by hand via SQL.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

drop policy if exists "fines_insert_board_only" on public.fines;
create policy "fines_insert_board_only" on public.fines
  for insert with check (
    community_id = public.current_community_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member)
  );
