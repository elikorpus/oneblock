-- OneBlock — migration 018: multi-option polls + HOA poll deletion
--
-- 1. Polls were hardcoded to exactly two choices (option_a/option_b on the
--    poll row itself). Boards asked for more than two options, so choices
--    move into their own poll_options table and poll_votes now references
--    the chosen option row instead of a fixed 'a'/'b' choice. The old
--    option_a/option_b/choice columns are left in place (unused) rather than
--    dropped, same as every other migration in this project.
--
-- 2. HOA board members can now delete a poll — same moderate_delete_* RPC +
--    moderation_log pattern as every other entity type.
--
-- Run this once in the Supabase SQL Editor, after migration_014. Safe to re-run.

create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  position int not null default 0,
  text text not null,
  unique (poll_id, position)
);

grant select, insert on public.poll_options to authenticated, service_role;

alter table public.poll_options enable row level security;
drop policy if exists "poll_options_select_same_community" on public.poll_options;
create policy "poll_options_select_same_community" on public.poll_options
  for select using (
    exists (select 1 from public.polls pl where pl.id = poll_options.poll_id and pl.community_id = public.current_community_id())
  );
drop policy if exists "poll_options_insert_board_only" on public.poll_options;
create policy "poll_options_insert_board_only" on public.poll_options
  for insert with check (
    exists (
      select 1 from public.polls pl
      where pl.id = poll_options.poll_id
        and pl.community_id = public.current_community_id()
        and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = pl.community_id)
    )
  );

-- Backfill existing two-option polls into poll_options.
insert into public.poll_options (poll_id, position, text)
select id, 0, option_a from public.polls
on conflict (poll_id, position) do nothing;
insert into public.poll_options (poll_id, position, text)
select id, 1, option_b from public.polls
on conflict (poll_id, position) do nothing;

-- poll_votes moves from a fixed 'a'/'b' choice to an option_id reference.
alter table public.poll_votes add column if not exists option_id uuid references public.poll_options (id) on delete cascade;
alter table public.poll_votes drop constraint if exists poll_votes_choice_check;
alter table public.poll_votes alter column choice drop not null;

update public.poll_votes pv
set option_id = po.id
from public.poll_options po
where pv.option_id is null
  and po.poll_id = pv.poll_id
  and po.position = (case pv.choice when 'a' then 0 when 'b' then 1 end);

grant select, insert on public.poll_votes to authenticated, service_role;

-- ============================================================================
-- HOA poll deletion
-- ============================================================================

alter table public.moderation_log drop constraint if exists moderation_log_entity_type_check;
alter table public.moderation_log add constraint moderation_log_entity_type_check
  check (entity_type in ('club_post', 'event', 'community_spot', 'ask', 'community_post', 'poll'));

create or replace function public.moderate_delete_poll(p_poll_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_community uuid;
begin
  select pl.title, pl.community_id into v_summary, v_community
  from public.polls pl
  where pl.id = p_poll_id;

  if v_community is null then
    return;
  end if;
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_board_member and p.community_id = v_community) then
    raise exception 'Not authorized';
  end if;

  insert into public.moderation_log (community_id, board_profile_id, entity_type, summary)
  values (v_community, auth.uid(), 'poll', v_summary);
  delete from public.polls where id = p_poll_id;
end;
$$;

grant execute on function public.moderate_delete_poll(uuid) to authenticated;
