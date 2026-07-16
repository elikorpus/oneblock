-- Replaces the fine-specific fair/unfair vote with a general open poll: the
-- board picks a title, description, and two options; residents just vote for
-- one of the two. The old fines/fine_votes tables are left in place (unused)
-- rather than dropped, since dropping isn't reversible.
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  board_profile_id uuid references public.profiles (id) on delete set null,
  title text not null,
  description text not null default '',
  option_a text not null,
  option_b text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  choice text not null check (choice in ('a', 'b')),
  primary key (poll_id, profile_id)
);

alter table public.polls enable row level security;
drop policy if exists "polls_select_same_community" on public.polls;
create policy "polls_select_same_community" on public.polls
  for select using (community_id = public.current_community_id());

drop policy if exists "polls_insert_board_only" on public.polls;
create policy "polls_insert_board_only" on public.polls
  for insert with check (
    community_id = public.current_community_id()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = polls.community_id)
  );

alter table public.poll_votes enable row level security;
drop policy if exists "poll_votes_select_same_community" on public.poll_votes;
create policy "poll_votes_select_same_community" on public.poll_votes
  for select using (
    exists (select 1 from public.polls pl where pl.id = poll_votes.poll_id and pl.community_id = public.current_community_id())
  );

drop policy if exists "poll_votes_insert_own" on public.poll_votes;
create policy "poll_votes_insert_own" on public.poll_votes
  for insert with check (
    profile_id = auth.uid()
    and exists (select 1 from public.polls pl where pl.id = poll_votes.poll_id and pl.community_id = public.current_community_id())
  );

grant select, insert on public.polls to authenticated, service_role;
grant select, insert on public.poll_votes to authenticated, service_role;
