-- Neighborly — migration 009: make "message the board" actually reach the board
--
-- Three bugs in the original design:
--
-- 1. board_messages_select_own only ever let a resident see rows where
--    profile_id = their own id. Since profile_id identifies *whose thread*
--    a message belongs to (not who wrote it), this meant a board member
--    could never see any other resident's message — the feature was a dead
--    end. Every "reply" the resident saw was a client-side fake (a canned
--    string inserted 700ms after they sent their message), not a real board
--    member.
-- 2. board_messages_insert_own never restricted the `from_board` column, so
--    any resident could set from_board = true on their own row and forge a
--    board reply.
-- 3. No notification was ever created in either direction, so even once a
--    board member could see the message, they'd have no way to know one
--    arrived without manually opening the tab.
--
-- Fix: board members can read every thread in their community and are the
-- only ones allowed to write from_board = true; a trigger notifies the
-- right people in both directions (residents -> all board members, board -> that resident).
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

drop policy if exists "board_messages_select_own" on public.board_messages;
drop policy if exists "board_messages_select_own_or_board" on public.board_messages;
create policy "board_messages_select_own_or_board" on public.board_messages
  for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_board_member and p.community_id = board_messages.community_id
    )
  );

-- `profile_id` identifies *whose thread* a row belongs to, not who wrote it — a
-- board member replying inside a resident's thread inserts with profile_id set
-- to that resident's id, not their own. So this can't just require
-- profile_id = auth.uid() unconditionally; it branches on who's writing.
drop policy if exists "board_messages_insert_own" on public.board_messages;
create policy "board_messages_insert_own" on public.board_messages
  for insert with check (
    community_id = public.current_community_id()
    and (
      (profile_id = auth.uid() and not from_board)
      or (
        from_board
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member)
        and exists (select 1 from public.profiles p2 where p2.id = board_messages.profile_id and p2.community_id = public.current_community_id())
      )
    )
  );

create or replace function public.notify_on_board_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
begin
  if new.from_board then
    insert into public.notifications (community_id, profile_id, emoji, tint, title, sub, go_type, go_id)
    values (new.community_id, new.profile_id, '🏛️', '#E5D9F5', 'The board replied', left(new.text, 80), 'tab', 'HOA');
  else
    select trim(first_name || ' ' || last_name) into v_sender_name from public.profiles where id = new.profile_id;
    insert into public.notifications (community_id, profile_id, emoji, tint, title, sub, go_type, go_id)
    select new.community_id, p.id, '🏛️', '#E5D9F5', 'New message to the board',
           coalesce(nullif(v_sender_name, ''), 'A neighbor') || ': ' || left(new.text, 60), 'tab', 'HOA'
    from public.profiles p
    where p.community_id = new.community_id and p.is_board_member and p.id <> new.profile_id;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_on_board_message on public.board_messages;
create trigger notify_on_board_message
  after insert on public.board_messages
  for each row
  execute function public.notify_on_board_message();
