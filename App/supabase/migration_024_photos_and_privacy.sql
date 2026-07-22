-- OneBlock — migration 024: profile photos + private profiles.
--
-- Adds:
--   - profiles.avatar_url (self-service profile photo, same pattern as clubs.header_url)
--   - profiles.is_private (hides everything except name + shared interests from other
--     residents — enforced client-side like every other directory field in this schema,
--     since Postgres RLS is row- not column-level and the existing profiles_select_same_community
--     policy already exposes full rows within a community; email is likewise never populated
--     into the directory client-side today for the same reason)
--   - a public "profile-photos" Storage bucket, owner-write-only by path prefix
--   - p_is_private threaded through complete_profile (same pattern as migration_022's birthday)
--
-- Run this once in the Supabase SQL Editor, after migration_023.

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists is_private boolean not null default false;

drop function if exists public.complete_profile(text, text, text, text, text, text, text, text, text[], date);

create or replace function public.complete_profile(
  p_signup_key text,
  p_first_name text,
  p_last_name text,
  p_age text,
  p_house_id text,
  p_profession text,
  p_years_in text,
  p_bio text,
  p_interests text[],
  p_birthday date,
  p_is_private boolean default false
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
    id, community_id, first_name, last_name, age, street, profession, years_in, bio, interests, house_id, birthday, is_private
  )
  values (
    auth.uid(), v_community_id, p_first_name, p_last_name, p_age, v_house_address, p_profession, p_years_in, p_bio, p_interests, p_house_id, p_birthday, p_is_private
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
    house_id = excluded.house_id,
    birthday = excluded.birthday,
    is_private = excluded.is_private;

  update public.houses set resident_profile_id = auth.uid() where community_id = v_community_id and id = p_house_id;
end;
$$;

grant execute on function public.complete_profile(text, text, text, text, text, text, text, text, text[], date, boolean) to authenticated;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read" on storage.objects
  for select using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_write_own" on storage.objects;
create policy "profile_photos_write_own" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own" on storage.objects
  for update using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
