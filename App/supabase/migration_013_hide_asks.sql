-- Per-user "hide this ask" (moves it to a personal Hidden tab without deleting it
-- for anyone else). Distinct from moderate_delete_ask, which is board-only and
-- removes the ask for everyone.
create table if not exists public.ask_hides (
  ask_id uuid not null references public.asks (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ask_id, profile_id)
);

alter table public.ask_hides enable row level security;

drop policy if exists "ask_hides_select_own" on public.ask_hides;
create policy "ask_hides_select_own" on public.ask_hides
  for select using (profile_id = auth.uid());

drop policy if exists "ask_hides_insert_own" on public.ask_hides;
create policy "ask_hides_insert_own" on public.ask_hides
  for insert with check (profile_id = auth.uid());

drop policy if exists "ask_hides_delete_own" on public.ask_hides;
create policy "ask_hides_delete_own" on public.ask_hides
  for delete using (profile_id = auth.uid());

grant select, insert, delete on public.ask_hides to authenticated, service_role;
