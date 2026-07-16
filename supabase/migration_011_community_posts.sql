-- Neighborly — migration 011: free-form community posts on the Today feed
--
-- Adds a genuinely open "share something" post — not tied to a club, an ask,
-- or an announcement — that any resident can write and any board member can
-- remove (same moderation-log pattern as everything else).
--
-- Run this once in the Supabase SQL Editor, after migration_007. Safe to re-run.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  author_profile_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.community_posts to authenticated, service_role;

alter table public.community_posts enable row level security;
drop policy if exists "community_posts_select_same_community" on public.community_posts;
create policy "community_posts_select_same_community" on public.community_posts
  for select using (community_id = public.current_community_id());
drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own" on public.community_posts
  for insert with check (author_profile_id = auth.uid() and community_id = public.current_community_id());

alter table public.moderation_log drop constraint if exists moderation_log_entity_type_check;
alter table public.moderation_log add constraint moderation_log_entity_type_check
  check (entity_type in ('club_post', 'event', 'community_spot', 'ask', 'community_post'));

create or replace function public.moderate_delete_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select cp.text, cp.community_id into v_summary, v_community
  from public.community_posts cp
  where cp.id = p_post_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'community_post', v_summary);
  delete from public.community_posts where id = p_post_id;
end;
$$;

grant execute on function public.moderate_delete_post(uuid) to authenticated;
