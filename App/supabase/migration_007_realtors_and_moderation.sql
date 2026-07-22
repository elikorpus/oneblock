-- OneBlock — migration 007: realtor accounts + HOA board moderation
--
-- Two independent features:
--
-- 1. Realtors are not residents — they don't belong to one community or
--    house, and they only ever need to browse every community's score. They
--    get their own account type (realtor_accounts), created through their own
--    signup-key flow (realtor_signup_keys), completely separate from the
--    resident `profiles` table.
--
-- 2. HOA board members get real moderation power: delete any club post,
--    event, community spot, or ask in their own community. Every deletion is
--    logged to moderation_log (visible only to other board members in that
--    community) so it's auditable. Deletion happens through a SECURITY
--    DEFINER RPC per entity type so the log write and the delete happen
--    atomically — never one without the other.
--
-- Run this once in the Supabase SQL Editor, after migrations 001-006.
-- Safe to re-run.

-- ============================================================================
-- REALTOR ACCOUNTS
-- ============================================================================

create table if not exists public.realtor_signup_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.realtor_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  tag text not null default '',
  phone text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.realtor_accounts to authenticated;

alter table public.realtor_accounts enable row level security;
drop policy if exists "realtor_accounts_select_own" on public.realtor_accounts;
create policy "realtor_accounts_select_own" on public.realtor_accounts
  for select using (id = auth.uid());
drop policy if exists "realtor_accounts_update_own" on public.realtor_accounts;
create policy "realtor_accounts_update_own" on public.realtor_accounts
  for update using (id = auth.uid()) with check (id = auth.uid());

-- no policies on realtor_signup_keys: reached only through the RPC below,
-- same pattern as public.communities' signup_key.
alter table public.realtor_signup_keys enable row level security;

create or replace function public.validate_realtor_signup_key(key text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.realtor_signup_keys where realtor_signup_keys.key = validate_realtor_signup_key.key)
$$;

grant execute on function public.validate_realtor_signup_key(text) to anon, authenticated;

create or replace function public.complete_realtor_signup(
  p_signup_key text,
  p_name text,
  p_tag text,
  p_phone text,
  p_email text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.realtor_signup_keys where key = p_signup_key) then
    raise exception 'Invalid realtor signup key';
  end if;

  insert into public.realtor_accounts (id, name, tag, phone, email)
  values (auth.uid(), p_name, p_tag, p_phone, p_email)
  on conflict (id) do update set
    name = excluded.name,
    tag = excluded.tag,
    phone = excluded.phone,
    email = excluded.email;
end;
$$;

grant execute on function public.complete_realtor_signup(text, text, text, text, text) to authenticated;

-- Same fields/formula as community_insights(), but for an arbitrary community
-- rather than only the caller's own — powers the realtor score-breakdown
-- page. Still aggregate-only (no resident PII), same trust level as the
-- already-broadly-granted community_scores().
create or replace function public.community_insights_for(p_community_id uuid)
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
  with cid as (select p_community_id as id),
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

grant execute on function public.community_insights_for(uuid) to authenticated;

-- ============================================================================
-- HOA BOARD MODERATION
-- ============================================================================

create table if not exists public.moderation_log (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  board_profile_id uuid references public.profiles (id) on delete set null,
  entity_type text not null check (entity_type in ('club_post', 'event', 'community_spot', 'ask')),
  summary text not null default '',
  created_at timestamptz not null default now()
);

alter table public.moderation_log enable row level security;
drop policy if exists "moderation_log_select_board_only" on public.moderation_log;
create policy "moderation_log_select_board_only" on public.moderation_log
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = moderation_log.community_id)
  );
-- no insert/update/delete policy: only the SECURITY DEFINER functions below write to this table.

create or replace function public.moderate_delete_club_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select cp.text, c.community_id into v_summary, v_community
  from public.club_posts cp
  join public.clubs c on c.id = cp.club_id
  where cp.id = p_post_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'club_post', v_summary);
  delete from public.club_posts where id = p_post_id;
end;
$$;

grant execute on function public.moderate_delete_club_post(uuid) to authenticated;

create or replace function public.moderate_delete_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select e.title, e.community_id into v_summary, v_community
  from public.events e
  where e.id = p_event_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'event', v_summary);
  delete from public.events where id = p_event_id;
end;
$$;

grant execute on function public.moderate_delete_event(uuid) to authenticated;

create or replace function public.moderate_delete_spot(p_spot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select s.name, s.community_id into v_summary, v_community
  from public.community_spots s
  where s.id = p_spot_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'community_spot', v_summary);
  delete from public.community_spots where id = p_spot_id;
end;
$$;

grant execute on function public.moderate_delete_spot(uuid) to authenticated;

create or replace function public.moderate_delete_ask(p_ask_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select a.text, a.community_id into v_summary, v_community
  from public.asks a
  where a.id = p_ask_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'ask', v_summary);
  delete from public.asks where id = p_ask_id;
end;
$$;

grant execute on function public.moderate_delete_ask(uuid) to authenticated;
