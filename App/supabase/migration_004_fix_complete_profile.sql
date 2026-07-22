-- OneBlock — migration 004: fix ambiguous column reference in complete_profile
--
-- Bug: the `signup_key` parameter had the exact same name as the `signup_key`
-- column on public.communities. Postgres could not disambiguate them even with
-- partial qualification, so every signup was failing at this step with
-- "column reference \"signup_key\" is ambiguous" (42702) — the auth account
-- got created, but the profile row never did, leaving the resident stuck
-- signed-in-but-profileless (which looks like the page just reset to Login).
--
-- Run this once in the Supabase SQL Editor.

drop function if exists public.complete_profile(text, text, text, text, text, text, text, text, text[]);

create or replace function public.complete_profile(
  p_signup_key text,
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
  select c.id into v_community_id from public.communities c where c.signup_key = p_signup_key;
  if v_community_id is null then
    raise exception 'Invalid signup key';
  end if;

  select h.address into v_house_address
  from public.houses h
  where h.community_id = v_community_id and h.id = p_house_id and h.resident_profile_id is null
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
