-- The "hide" feature from migration_013 was built on the wrong tab (Ask) — it was
-- meant for the HOA messaging inbox instead, as a board-only "Archive" action on a
-- resident's thread. Drop the unused ask_hides table and replace it with this.
drop table if exists public.ask_hides;

create table if not exists public.board_thread_archives (
  resident_profile_id uuid primary key references public.profiles (id) on delete cascade,
  archived_by uuid references public.profiles (id) on delete set null,
  archived_at timestamptz not null default now()
);

alter table public.board_thread_archives enable row level security;

drop policy if exists "board_thread_archives_select_board" on public.board_thread_archives;
create policy "board_thread_archives_select_board" on public.board_thread_archives
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.is_board_member
      and p.community_id = (select p2.community_id from public.profiles p2 where p2.id = board_thread_archives.resident_profile_id)
    )
  );

drop policy if exists "board_thread_archives_insert_board" on public.board_thread_archives;
create policy "board_thread_archives_insert_board" on public.board_thread_archives
  for insert with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.is_board_member
      and p.community_id = (select p2.community_id from public.profiles p2 where p2.id = board_thread_archives.resident_profile_id)
    )
  );

drop policy if exists "board_thread_archives_delete_board" on public.board_thread_archives;
create policy "board_thread_archives_delete_board" on public.board_thread_archives
  for delete using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
      and p.is_board_member
      and p.community_id = (select p2.community_id from public.profiles p2 where p2.id = board_thread_archives.resident_profile_id)
    )
  );

grant select, insert, delete on public.board_thread_archives to authenticated, service_role;
