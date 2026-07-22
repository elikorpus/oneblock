-- OneBlock — migration 020: local businesses (with ratings + paid/sponsored spots)
-- and community emergency alerts.
--
-- Run this once in the Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Businesses (resident-submitted shoutouts + admin-curated paid/sponsored spots)
-- ---------------------------------------------------------------------------

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  added_by_profile_id uuid references public.profiles (id) on delete set null,
  name text not null,
  category text not null default '',
  description text not null default '',
  phone text not null default '',
  website text not null default '',
  address text not null default '',
  is_sponsored boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.businesses to authenticated, service_role;

alter table public.businesses enable row level security;

drop policy if exists "businesses_select_same_community" on public.businesses;
create policy "businesses_select_same_community" on public.businesses
  for select using (community_id = public.current_community_id());

drop policy if exists "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own" on public.businesses
  for insert with check (
    added_by_profile_id = auth.uid()
    and community_id = public.current_community_id()
    and is_sponsored = false
  );

-- Residents can't edit/delete directly: edits (e.g. marking a listing "Sponsored")
-- happen from the admin console with the service-role key, and removal happens
-- only through moderate_delete_business() below.

-- ---------------------------------------------------------------------------
-- 1-5 star ratings, one per resident per business (upsert to change your rating)
-- ---------------------------------------------------------------------------

create table if not exists public.business_ratings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (business_id, profile_id)
);

grant select, insert, update, delete on public.business_ratings to authenticated, service_role;

alter table public.business_ratings enable row level security;

drop policy if exists "business_ratings_select_same_community" on public.business_ratings;
create policy "business_ratings_select_same_community" on public.business_ratings
  for select using (
    exists (
      select 1 from public.businesses b
      where b.id = business_ratings.business_id and b.community_id = public.current_community_id()
    )
  );

drop policy if exists "business_ratings_insert_own" on public.business_ratings;
create policy "business_ratings_insert_own" on public.business_ratings
  for insert with check (
    profile_id = auth.uid()
    and exists (
      select 1 from public.businesses b
      where b.id = business_ratings.business_id and b.community_id = public.current_community_id()
    )
  );

drop policy if exists "business_ratings_update_own" on public.business_ratings;
create policy "business_ratings_update_own" on public.business_ratings
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Emergency / crime alerts — any resident can report one; only the board can
-- remove it. Swiping it away on a resident's device only dismisses it for
-- them (alert_dismissals), it does not delete the underlying alert.
-- ---------------------------------------------------------------------------

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.alerts to authenticated, service_role;

alter table public.alerts enable row level security;

drop policy if exists "alerts_select_same_community" on public.alerts;
create policy "alerts_select_same_community" on public.alerts
  for select using (community_id = public.current_community_id());

drop policy if exists "alerts_insert_own" on public.alerts;
create policy "alerts_insert_own" on public.alerts
  for insert with check (author_profile_id = auth.uid() and community_id = public.current_community_id());

-- No update/delete policy for authenticated: an alert can only be removed
-- through moderate_delete_alert() below.

create table if not exists public.alert_dismissals (
  alert_id uuid not null references public.alerts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (alert_id, profile_id)
);

grant select, insert, update, delete on public.alert_dismissals to authenticated, service_role;

alter table public.alert_dismissals enable row level security;

drop policy if exists "alert_dismissals_select_own" on public.alert_dismissals;
create policy "alert_dismissals_select_own" on public.alert_dismissals
  for select using (profile_id = auth.uid());

drop policy if exists "alert_dismissals_insert_own" on public.alert_dismissals;
create policy "alert_dismissals_insert_own" on public.alert_dismissals
  for insert with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Moderation: widen moderation_log to accept the two new entity types, and
-- add the board-only delete RPCs for them (same shape as every other
-- moderate_delete_* function).
-- ---------------------------------------------------------------------------

alter table public.moderation_log drop constraint if exists moderation_log_entity_type_check;
alter table public.moderation_log add constraint moderation_log_entity_type_check
  check (entity_type in ('club_post', 'event', 'community_spot', 'ask', 'community_post', 'poll', 'business', 'alert'));

create or replace function public.moderate_delete_business(p_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select b.name, b.community_id into v_summary, v_community
  from public.businesses b
  where b.id = p_business_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'business', v_summary);
  delete from public.businesses where id = p_business_id;
end;
$$;

grant execute on function public.moderate_delete_business(uuid) to authenticated;

create or replace function public.moderate_delete_alert(p_alert_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select a.title, a.community_id into v_summary, v_community
  from public.alerts a
  where a.id = p_alert_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'alert', v_summary);
  delete from public.alerts where id = p_alert_id;
end;
$$;

grant execute on function public.moderate_delete_alert(uuid) to authenticated;
