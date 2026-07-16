-- OneBlock — migration 002: real addresses + map coordinates
-- Run this once in the Supabase SQL Editor, after schema.sql.
-- Safe to re-run.

-- ============================================================================
-- HOUSES: replace the old x/y percentage columns (hand-drawn map) with a real
-- address + lat/lng (react-native-maps). `id` is now the address itself.
-- ============================================================================

alter table public.houses add column if not exists address text;
alter table public.houses add column if not exists latitude numeric;
alter table public.houses add column if not exists longitude numeric;
alter table public.houses drop column if exists x;
alter table public.houses drop column if exists y;

alter table public.houses alter column address set not null;
alter table public.houses alter column latitude set not null;
alter table public.houses alter column longitude set not null;

-- ============================================================================
-- Onboarding needs to list a community's unclaimed addresses BEFORE the
-- resident has an account — anon-callable, security definer, scoped by key.
-- ============================================================================

create or replace function public.list_open_houses(key text)
returns table (house_id text, address text, latitude numeric, longitude numeric)
language sql
security definer
stable
set search_path = public
as $$
  select h.id, h.address, h.latitude, h.longitude
  from public.houses h
  join public.communities c on c.id = h.community_id
  where c.signup_key = key and h.resident_profile_id is null
  order by h.address
$$;

grant execute on function public.list_open_houses(text) to anon, authenticated;

-- ============================================================================
-- complete_profile: now claims a specific house instead of taking free-text
-- street. Re-validates the house is real, in the right community, and still
-- unclaimed — so signup is only possible with a genuine, available address.
-- ============================================================================

drop function if exists public.complete_profile(text, text, text, text, text, text, text, text, text[]);

create or replace function public.complete_profile(
  signup_key text,
  p_first_name text,
  p_last_name text,
  p_age text,
  p_house_id text,
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
  v_house_address text;
begin
  select id into v_community_id from public.communities where signup_key = complete_profile.signup_key;
  if v_community_id is null then
    raise exception 'Invalid signup key';
  end if;

  select address into v_house_address
  from public.houses
  where community_id = v_community_id and id = p_house_id and resident_profile_id is null
  for update;

  if v_house_address is null then
    raise exception 'That address is not available in this community';
  end if;

  insert into public.profiles (
    id, community_id, first_name, last_name, age, street, profession, years_in, bio, interests, house_id
  )
  values (
    auth.uid(), v_community_id, p_first_name, p_last_name, p_age, v_house_address, p_profession, p_years_in, p_bio, p_interests, p_house_id
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
    interests = excluded.interests,
    house_id = excluded.house_id;

  update public.houses set resident_profile_id = auth.uid() where community_id = v_community_id and id = p_house_id;
end;
$$;

grant execute on function public.complete_profile(text, text, text, text, text, text, text, text, text[]) to authenticated;
