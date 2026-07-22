-- OneBlock — migration 005: production features
--
-- Replaces the remaining pieces of the app that were still faked client-side
-- (a random neighborhood score, a hardcoded realtor list, a hardcoded
-- "taco truck" spot, club event RSVPs that never left local state) with real
-- tables and RPCs computed from actual community activity.
--
-- Run this once in the Supabase SQL Editor, after schema.sql and migrations 002-004.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.

-- ============================================================================
-- TABLES
-- ============================================================================

create table if not exists public.realtors (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  name text not null,
  tag text not null default '',
  deals_note text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.home_leads (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('list', 'valuation', 'realtor_contact')),
  realtor_id uuid references public.realtors (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.club_event_rsvps (
  club_id uuid not null references public.clubs (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  going boolean not null default true,
  primary key (club_id, profile_id)
);

create table if not exists public.community_spots (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  added_by_profile_id uuid references public.profiles (id) on delete set null,
  emoji text not null default '📍',
  name text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.realtors, public.home_leads, public.club_event_rsvps, public.community_spots to authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.realtors enable row level security;
drop policy if exists "realtors_select_same_community" on public.realtors;
create policy "realtors_select_same_community" on public.realtors
  for select using (community_id = public.current_community_id());
drop policy if exists "realtors_insert_board_only" on public.realtors;
create policy "realtors_insert_board_only" on public.realtors
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = realtors.community_id)
  );

alter table public.home_leads enable row level security;
drop policy if exists "home_leads_select_own" on public.home_leads;
create policy "home_leads_select_own" on public.home_leads
  for select using (profile_id = auth.uid());
drop policy if exists "home_leads_insert_own" on public.home_leads;
create policy "home_leads_insert_own" on public.home_leads
  for insert with check (profile_id = auth.uid() and community_id = public.current_community_id());

alter table public.club_event_rsvps enable row level security;
drop policy if exists "club_event_rsvps_select_same_community" on public.club_event_rsvps;
create policy "club_event_rsvps_select_same_community" on public.club_event_rsvps
  for select using (
    exists (select 1 from public.clubs c where c.id = club_event_rsvps.club_id and c.community_id = public.current_community_id())
  );
drop policy if exists "club_event_rsvps_write_own" on public.club_event_rsvps;
create policy "club_event_rsvps_write_own" on public.club_event_rsvps
  for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

alter table public.community_spots enable row level security;
drop policy if exists "community_spots_select_same_community" on public.community_spots;
create policy "community_spots_select_same_community" on public.community_spots
  for select using (community_id = public.current_community_id());
drop policy if exists "community_spots_insert_same_community" on public.community_spots;
create policy "community_spots_insert_same_community" on public.community_spots
  for insert with check (
    added_by_profile_id = auth.uid() and community_id = public.current_community_id()
  );

-- ============================================================================
-- RPCs
-- ============================================================================

-- A signed-in resident's own community name + signup key (so "Invite neighbors"
-- can share the real code — every existing member already has it from their
-- own welcome card, this just lets them pass it on).
create or replace function public.current_community_details()
returns table (id uuid, name text, signup_key text)
language sql
security definer
stable
set search_path = public
as $$
  select c.id, c.name, c.signup_key
  from public.communities c
  where c.id = public.current_community_id()
$$;

grant execute on function public.current_community_details() to authenticated;

-- Real, computed stats + score for the caller's own community. Replaces the
-- hardcoded 87/"Cypress Bend" score and the fabricated trend list in Sell.tsx.
-- Score is null (not a fake number) when the community has no residents yet.
create or replace function public.community_insights()
returns table (
  community_id uuid,
  household_count integer,
  houses_total integer,
  kids_count integer,
  events_last_90d integer,
  avg_response_minutes numeric,
  connected_rate numeric,
  club_participation_rate numeric,
  welcome_rate numeric,
  score integer
)
language sql
security definer
stable
set search_path = public
as $$
  with cid as (select public.current_community_id() as id),
  households as (
    select count(*)::int as n from public.profiles p, cid where p.community_id = cid.id
  ),
  houses as (
    select count(*)::int as n from public.houses h, cid where h.community_id = cid.id
  ),
  kids as (
    select count(*)::int as n
    from public.family_members fm
    join public.profiles p on p.id = fm.profile_id, cid
    where p.community_id = cid.id and fm.relation = 'Kid'
  ),
  events90 as (
    select count(*)::int as n
    from public.events e, cid
    where e.community_id = cid.id and e.event_date is not null and e.event_date >= current_date - 90
  ),
  ask_first_reply as (
    select a.id as ask_id, a.author_profile_id, a.created_at as asked_at,
           min(m.created_at) filter (where m.sender_profile_id <> a.author_profile_id) as replied_at
    from public.asks a
    join public.ask_messages m on m.ask_id = a.id, cid
    where a.community_id = cid.id
    group by a.id, a.author_profile_id, a.created_at
  ),
  response as (
    select avg(extract(epoch from (replied_at - asked_at)) / 60.0) as avg_minutes
    from ask_first_reply
    where replied_at is not null
  ),
  wave_agg as (
    select count(distinct p.id)::int as n
    from public.profiles p, cid
    where p.community_id = cid.id
      and (exists (select 1 from public.waves w where w.from_profile_id = p.id)
        or exists (select 1 from public.waves w where w.to_profile_id = p.id))
  ),
  club_part as (
    select count(distinct cm.profile_id)::int as n
    from public.club_members cm
    join public.clubs c on c.id = cm.club_id, cid
    where c.community_id = cid.id
  ),
  new_neighbors as (
    select count(*)::int as n from public.profiles p, cid
    where p.community_id = cid.id and p.created_at >= now() - interval '30 days'
  ),
  new_neighbors_waved as (
    select count(*)::int as n from public.profiles p, cid
    where p.community_id = cid.id
      and p.created_at >= now() - interval '30 days'
      and exists (select 1 from public.waves w where w.to_profile_id = p.id)
  )
  select
    cid.id,
    households.n,
    houses.n,
    kids.n,
    events90.n,
    response.avg_minutes,
    case when households.n = 0 then null else least(wave_agg.n::numeric / households.n, 1) end,
    case when households.n = 0 then null else least(club_part.n::numeric / households.n, 1) end,
    case when new_neighbors.n = 0 then null else new_neighbors_waved.n::numeric / new_neighbors.n end,
    case when households.n = 0 then null else
      round(
        30 * least(households.n::numeric / nullif(houses.n, 0), 1)
        + 25 * least((events90.n / 3.0) / 8.0, 1)
        + 20 * least(club_part.n::numeric / nullif(households.n, 0), 1)
        + 15 * (case when response.avg_minutes is null then 0.5 else greatest(0, least(1, 1 - response.avg_minutes / 120.0)) end)
        + 10 * least(wave_agg.n::numeric / nullif(households.n, 0), 1)
      )::int
    end
  from cid, households, houses, kids, events90, response, wave_agg, club_part, new_neighbors, new_neighbors_waved
$$;

grant execute on function public.community_insights() to authenticated;

-- Same score, computed for every community — powers "Explore neighborhoods".
-- Only ever returns aggregate counts/scores, never individual residents' data,
-- matching the "anonymous, community-level data only" promise already in the UI.
create or replace function public.community_scores()
returns table (
  community_id uuid,
  name text,
  household_count integer,
  events_per_month numeric,
  kids_count integer,
  score integer
)
language sql
security definer
stable
set search_path = public
as $$
  with households as (
    select community_id, count(*)::int as n from public.profiles group by community_id
  ),
  houses as (
    select community_id, count(*)::int as n from public.houses group by community_id
  ),
  kids as (
    select p.community_id, count(*)::int as n
    from public.family_members fm
    join public.profiles p on p.id = fm.profile_id
    where fm.relation = 'Kid'
    group by p.community_id
  ),
  events90 as (
    select community_id, count(*)::int as n
    from public.events
    where event_date is not null and event_date >= current_date - 90
    group by community_id
  ),
  ask_first_reply as (
    select a.id as ask_id, a.community_id, a.created_at as asked_at,
           min(m.created_at) filter (where m.sender_profile_id <> a.author_profile_id) as replied_at
    from public.asks a
    join public.ask_messages m on m.ask_id = a.id
    group by a.id, a.community_id, a.created_at
  ),
  response as (
    select community_id, avg(extract(epoch from (replied_at - asked_at)) / 60.0) as avg_minutes
    from ask_first_reply
    where replied_at is not null
    group by community_id
  ),
  wave_agg as (
    select p.community_id, count(distinct p.id)::int as n
    from public.profiles p
    where exists (select 1 from public.waves w where w.from_profile_id = p.id)
       or exists (select 1 from public.waves w where w.to_profile_id = p.id)
    group by p.community_id
  ),
  club_part as (
    select c.community_id, count(distinct cm.profile_id)::int as n
    from public.club_members cm
    join public.clubs c on c.id = cm.club_id
    group by c.community_id
  )
  select
    c.id,
    c.name,
    coalesce(households.n, 0),
    round(coalesce(events90.n, 0) / 3.0, 1),
    coalesce(kids.n, 0),
    case when coalesce(households.n, 0) = 0 then null else
      round(
        30 * least(coalesce(households.n, 0)::numeric / nullif(houses.n, 0), 1)
        + 25 * least((coalesce(events90.n, 0) / 3.0) / 8.0, 1)
        + 20 * least(coalesce(club_part.n, 0)::numeric / nullif(households.n, 0), 1)
        + 15 * (case when response.avg_minutes is null then 0.5 else greatest(0, least(1, 1 - response.avg_minutes / 120.0)) end)
        + 10 * least(coalesce(wave_agg.n, 0)::numeric / nullif(households.n, 0), 1)
      )::int
    end
  from public.communities c
  left join households on households.community_id = c.id
  left join houses on houses.community_id = c.id
  left join kids on kids.community_id = c.id
  left join events90 on events90.community_id = c.id
  left join response on response.community_id = c.id
  left join wave_agg on wave_agg.community_id = c.id
  left join club_part on club_part.community_id = c.id
$$;

grant execute on function public.community_scores() to authenticated;
