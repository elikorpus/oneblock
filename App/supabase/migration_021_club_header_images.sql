-- OneBlock — migration 021: club header image upload.
--
-- Adds a header_url column to clubs, a "clubs_update_lead_or_board" policy so
-- the club's lead or any board member can set it, and a public Storage bucket
-- ("club-images") with policies restricting uploads to that same group.
-- Images are stored at "<club_id>/header.jpg" so ownership can be checked
-- from the path alone.
--
-- Run this once in the Supabase SQL Editor.

alter table public.clubs add column if not exists header_url text;

drop policy if exists "clubs_update_lead_or_board" on public.clubs;
create policy "clubs_update_lead_or_board" on public.clubs
  for update using (
    lead_profile_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_board_member and p.community_id = clubs.community_id
    )
  )
  with check (community_id = public.current_community_id());

insert into storage.buckets (id, name, public)
values ('club-images', 'club-images', true)
on conflict (id) do update set public = true;

drop policy if exists "club_images_public_read" on storage.objects;
create policy "club_images_public_read" on storage.objects
  for select using (bucket_id = 'club-images');

drop policy if exists "club_images_write_by_lead_or_board" on storage.objects;
create policy "club_images_write_by_lead_or_board" on storage.objects
  for insert with check (
    bucket_id = 'club-images'
    and exists (
      select 1 from public.clubs c
      where c.id::text = (storage.foldername(name))[1]
        and (
          c.lead_profile_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_board_member and p.community_id = c.community_id
          )
        )
    )
  );

drop policy if exists "club_images_update_by_lead_or_board" on storage.objects;
create policy "club_images_update_by_lead_or_board" on storage.objects
  for update using (
    bucket_id = 'club-images'
    and exists (
      select 1 from public.clubs c
      where c.id::text = (storage.foldername(name))[1]
        and (
          c.lead_profile_id = auth.uid()
          or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.is_board_member and p.community_id = c.community_id
          )
        )
    )
  );
