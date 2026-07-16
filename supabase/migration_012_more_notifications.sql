-- Neighborly — migration 012: notify people for asks, new events, and waves
--
-- Only board messages ever generated a notification (migration_009). Nothing
-- notified you when someone replied to your ask, a neighbor posted a new
-- event, or someone waved at you — the Notifications tab was otherwise a
-- dead end for all of that. Adds three more triggers on the same pattern.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

alter table public.notifications drop constraint if exists notifications_go_type_check;
alter table public.notifications add constraint notifications_go_type_check
  check (go_type in ('tab', 'event', 'person', 'ask'));

-- Ask replies: notify every other participant in the thread (the ask's
-- author plus anyone who's replied), except whoever just sent this message.
create or replace function public.notify_on_ask_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_community uuid;
  v_sender_name text;
begin
  select a.community_id into v_community from public.asks a where a.id = new.ask_id;
  select trim(first_name || ' ' || last_name) into v_sender_name from public.profiles where id = new.sender_profile_id;

  insert into public.notifications (community_id, profile_id, emoji, tint, title, sub, go_type, go_id)
  select v_community, participants.profile_id, '🤝', '#E9F1E6',
         coalesce(nullif(v_sender_name, ''), 'A neighbor') || ' replied to your ask', left(new.text, 80), 'ask', new.ask_id::text
  from (
    select author_profile_id as profile_id from public.asks where id = new.ask_id
    union
    select sender_profile_id as profile_id from public.ask_messages where ask_id = new.ask_id
  ) participants
  where participants.profile_id <> new.sender_profile_id;
  return new;
end;
$$;

drop trigger if exists notify_on_ask_message on public.ask_messages;
create trigger notify_on_ask_message
  after insert on public.ask_messages
  for each row
  execute function public.notify_on_ask_message();

-- New events: notify everyone in the community except the host.
create or replace function public.notify_on_new_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (community_id, profile_id, emoji, tint, title, sub, go_type, go_id)
  select new.community_id, p.id, coalesce(nullif(new.emoji, ''), '📅'), '#F6E2CE', 'New event: ' || new.title, new.where_text, 'event', new.id::text
  from public.profiles p
  where p.community_id = new.community_id
    and (new.host_profile_id is null or p.id <> new.host_profile_id);
  return new;
end;
$$;

drop trigger if exists notify_on_new_event on public.events;
create trigger notify_on_new_event
  after insert on public.events
  for each row
  execute function public.notify_on_new_event();

-- Waves: notify the person who got waved at.
create or replace function public.notify_on_wave()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sender_name text;
  v_community uuid;
begin
  select trim(first_name || ' ' || last_name), community_id into v_sender_name, v_community
  from public.profiles where id = new.from_profile_id;

  insert into public.notifications (community_id, profile_id, emoji, tint, title, sub, go_type, go_id)
  values (v_community, new.to_profile_id, '👋', '#FBEBC7', coalesce(nullif(v_sender_name, ''), 'A neighbor') || ' waved at you', 'Say hi back on their profile', 'person', new.from_profile_id::text);
  return new;
end;
$$;

drop trigger if exists notify_on_wave on public.waves;
create trigger notify_on_wave
  after insert on public.waves
  for each row
  execute function public.notify_on_wave();
