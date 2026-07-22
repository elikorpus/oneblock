-- OneBlock — initial schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.

create extension if not exists pgcrypto;

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  signup_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  community_id uuid not null references public.communities (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  age text not null default '',
  street text not null default '',
  profession text not null default '',
  years_in text not null default '',
  bio text not null default '',
  interests text[] not null default '{}',
  job text not null default '',
  phone text not null default '',
  house_id text,
  connected boolean not null default true,
  helped_count integer not null default 0,
  is_board_member boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  relation text not null check (relation in ('Spouse', 'Kid', 'Pet')),
  age text not null default ''
);

create table if not exists public.houses (
  id text not null,
  community_id uuid not null references public.communities (id) on delete cascade,
  x numeric not null,
  y numeric not null,
  resident_profile_id uuid references public.profiles (id) on delete set null,
  primary key (community_id, id)
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  emoji text not null default '',
  name text not null,
  meets text not null default '',
  accent text not null default '',
  accent_deep text not null default '',
  tagline text not null default '',
  since_text text not null default '',
  spot text not null default '',
  about text not null default '',
  next_title text not null default '',
  next_when text not null default '',
  next_where text not null default '',
  lead_profile_id uuid references public.profiles (id) on delete set null,
  rules text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.club_members (
  club_id uuid not null references public.clubs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (club_id, profile_id)
);

create table if not exists public.club_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  emoji text not null default '',
  title text not null,
  event_date date,
  event_time text not null default '',
  where_text text not null default '',
  host_profile_id uuid references public.profiles (id) on delete set null,
  host_name text not null default '',
  accent text not null default '',
  accent_deep text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  going boolean not null default true,
  primary key (event_id, profile_id)
);

create table if not exists public.asks (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('Borrow', 'Favor', 'Recommend', 'Ask')),
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ask_messages (
  id uuid primary key default gen_random_uuid(),
  ask_id uuid not null references public.asks (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.fines (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  description text not null,
  address text not null default '',
  amount numeric not null default 0,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.fine_votes (
  fine_id uuid not null references public.fines (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  vote text not null check (vote in ('fair', 'unfair')),
  primary key (fine_id, profile_id)
);

create table if not exists public.pros (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  name text not null,
  tag text not null default '',
  used_count integer not null default 0
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  emoji text not null default '',
  tint text not null default '',
  title text not null,
  sub text not null default '',
  go_type text not null check (go_type in ('tab', 'event', 'person')),
  go_id text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_profile_id uuid references public.profiles (id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.board_messages (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  from_board boolean not null default false,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.waves (
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (from_profile_id, to_profile_id)
);

-- ============================================================================
-- HELPER: the calling user's own community_id
-- ============================================================================

create or replace function public.current_community_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select community_id from public.profiles where id = auth.uid()
$$;

-- ============================================================================
-- SIGNUP-KEY RPCs (communities table itself is never directly readable)
-- ============================================================================

create or replace function public.validate_signup_key(key text)
returns table (community_id uuid, name text)
language sql
security definer
stable
set search_path = public
as $$
  select id, name from public.communities where signup_key = key
$$;

grant execute on function public.validate_signup_key(text) to anon, authenticated;

create or replace function public.complete_profile(
  signup_key text,
  p_first_name text,
  p_last_name text,
  p_age text,
  p_street text,
  p_profession text,
  p_years_in text,
  p_bio text,
  p_interests text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community_id uuid;
begin
  select id into v_community_id from public.communities where signup_key = complete_profile.signup_key;
  if v_community_id is null then
    raise exception 'Invalid signup key';
  end if;

  insert into public.profiles (
    id, community_id, first_name, last_name, age, street, profession, years_in, bio, interests
  )
  values (
    auth.uid(), v_community_id, p_first_name, p_last_name, p_age, p_street, p_profession, p_years_in, p_bio, p_interests
  )
  on conflict (id) do update set
    community_id = excluded.community_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    age = excluded.age,
    street = excluded.street,
    profession = excluded.profession,
    years_in = excluded.years_in,
    bio = excluded.bio,
    interests = excluded.interests;
end;
$$;

grant execute on function public.complete_profile(text, text, text, text, text, text, text, text, text[]) to authenticated;

-- ============================================================================
-- GRANTS (table-level; RLS policies below still gate row access)
-- ============================================================================

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.communities enable row level security;
-- no policies on communities: it is reached only through the SECURITY DEFINER RPCs above.

alter table public.profiles enable row level security;
drop policy if exists "profiles_select_same_community" on public.profiles;
create policy "profiles_select_same_community" on public.profiles
  for select using (community_id = public.current_community_id());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

alter table public.family_members enable row level security;
drop policy if exists "family_select_same_community" on public.family_members;
create policy "family_select_same_community" on public.family_members
  for select using (
    exists (select 1 from public.profiles p where p.id = family_members.profile_id and p.community_id = public.current_community_id())
  );
drop policy if exists "family_write_own" on public.family_members;
create policy "family_write_own" on public.family_members
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

alter table public.houses enable row level security;
drop policy if exists "houses_select_same_community" on public.houses;
create policy "houses_select_same_community" on public.houses
  for select using (community_id = public.current_community_id());

alter table public.clubs enable row level security;
drop policy if exists "clubs_select_same_community" on public.clubs;
create policy "clubs_select_same_community" on public.clubs
  for select using (community_id = public.current_community_id());
drop policy if exists "clubs_insert_same_community" on public.clubs;
create policy "clubs_insert_same_community" on public.clubs
  for insert with check (community_id = public.current_community_id());

alter table public.club_members enable row level security;
drop policy if exists "club_members_select_same_community" on public.club_members;
create policy "club_members_select_same_community" on public.club_members
  for select using (
    exists (select 1 from public.clubs c where c.id = club_members.club_id and c.community_id = public.current_community_id())
  );
drop policy if exists "club_members_write_own" on public.club_members;
create policy "club_members_write_own" on public.club_members
  for all using (profile_id = auth.uid()) with check (
    profile_id = auth.uid()
    and exists (select 1 from public.clubs c where c.id = club_members.club_id and c.community_id = public.current_community_id())
  );

alter table public.club_posts enable row level security;
drop policy if exists "club_posts_select_same_community" on public.club_posts;
create policy "club_posts_select_same_community" on public.club_posts
  for select using (
    exists (select 1 from public.clubs c where c.id = club_posts.club_id and c.community_id = public.current_community_id())
  );
drop policy if exists "club_posts_insert_own" on public.club_posts;
create policy "club_posts_insert_own" on public.club_posts
  for insert with check (
    author_profile_id = auth.uid()
    and exists (select 1 from public.clubs c where c.id = club_posts.club_id and c.community_id = public.current_community_id())
  );

alter table public.events enable row level security;
drop policy if exists "events_select_same_community" on public.events;
create policy "events_select_same_community" on public.events
  for select using (community_id = public.current_community_id());
drop policy if exists "events_insert_same_community" on public.events;
create policy "events_insert_same_community" on public.events
  for insert with check (community_id = public.current_community_id());

alter table public.event_rsvps enable row level security;
drop policy if exists "event_rsvps_select_same_community" on public.event_rsvps;
create policy "event_rsvps_select_same_community" on public.event_rsvps
  for select using (
    exists (select 1 from public.events e where e.id = event_rsvps.event_id and e.community_id = public.current_community_id())
  );
drop policy if exists "event_rsvps_write_own" on public.event_rsvps;
create policy "event_rsvps_write_own" on public.event_rsvps
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

alter table public.asks enable row level security;
drop policy if exists "asks_select_same_community" on public.asks;
create policy "asks_select_same_community" on public.asks
  for select using (community_id = public.current_community_id());
drop policy if exists "asks_insert_own" on public.asks;
create policy "asks_insert_own" on public.asks
  for insert with check (author_profile_id = auth.uid() and community_id = public.current_community_id());

alter table public.ask_messages enable row level security;
drop policy if exists "ask_messages_select_same_community" on public.ask_messages;
create policy "ask_messages_select_same_community" on public.ask_messages
  for select using (
    exists (select 1 from public.asks a where a.id = ask_messages.ask_id and a.community_id = public.current_community_id())
  );
drop policy if exists "ask_messages_insert_own" on public.ask_messages;
create policy "ask_messages_insert_own" on public.ask_messages
  for insert with check (
    sender_profile_id = auth.uid()
    and exists (select 1 from public.asks a where a.id = ask_messages.ask_id and a.community_id = public.current_community_id())
  );

alter table public.fines enable row level security;
drop policy if exists "fines_select_same_community" on public.fines;
create policy "fines_select_same_community" on public.fines
  for select using (community_id = public.current_community_id());

alter table public.fine_votes enable row level security;
drop policy if exists "fine_votes_select_same_community" on public.fine_votes;
create policy "fine_votes_select_same_community" on public.fine_votes
  for select using (
    exists (select 1 from public.fines f where f.id = fine_votes.fine_id and f.community_id = public.current_community_id())
  );
drop policy if exists "fine_votes_insert_own" on public.fine_votes;
create policy "fine_votes_insert_own" on public.fine_votes
  for insert with check (
    profile_id = auth.uid()
    and exists (select 1 from public.fines f where f.id = fine_votes.fine_id and f.community_id = public.current_community_id())
  );

alter table public.pros enable row level security;
drop policy if exists "pros_select_same_community" on public.pros;
create policy "pros_select_same_community" on public.pros
  for select using (community_id = public.current_community_id());

alter table public.notifications enable row level security;
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (profile_id = auth.uid());
drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

alter table public.announcements enable row level security;
drop policy if exists "announcements_select_same_community" on public.announcements;
create policy "announcements_select_same_community" on public.announcements
  for select using (community_id = public.current_community_id());
drop policy if exists "announcements_insert_board_only" on public.announcements;
create policy "announcements_insert_board_only" on public.announcements
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = announcements.community_id)
  );

alter table public.board_messages enable row level security;
drop policy if exists "board_messages_select_own" on public.board_messages;
create policy "board_messages_select_own" on public.board_messages
  for select using (profile_id = auth.uid());
drop policy if exists "board_messages_insert_own" on public.board_messages;
create policy "board_messages_insert_own" on public.board_messages
  for insert with check (profile_id = auth.uid() and community_id = public.current_community_id());

alter table public.waves enable row level security;
drop policy if exists "waves_select_involving_me" on public.waves;
create policy "waves_select_involving_me" on public.waves
  for select using (from_profile_id = auth.uid() or to_profile_id = auth.uid());
drop policy if exists "waves_insert_own" on public.waves;
create policy "waves_insert_own" on public.waves
  for insert with check (
    from_profile_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = waves.to_profile_id and p.community_id = public.current_community_id())
  );
