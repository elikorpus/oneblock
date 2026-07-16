-- OneBlock — migration 006: stop residents from self-promoting to the HOA board
--
-- Bug: "profiles_update_own" only checks that a resident is updating their own
-- row (id = auth.uid()) — it never restricts which columns they change. Any
-- signed-in resident could currently call
--   supabase.from('profiles').update({ is_board_member: true }).eq('id', myId)
-- directly and grant themselves board access (which unlocks posting
-- announcements), since nothing in the database stopped it.
--
-- Fix: a trigger resets is_board_member back to its previous value whenever
-- the update comes from the app (auth.role() = 'authenticated', i.e. a normal
-- API request). It does NOT fire for changes made directly in the Supabase
-- SQL Editor — that's a superuser session, not an 'authenticated' API
-- request — so that stays the way to grant board membership:
--
--   update public.profiles set is_board_member = true where id = '<user-uuid>';
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

create or replace function public.protect_is_board_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'authenticated' and new.is_board_member is distinct from old.is_board_member then
    new.is_board_member := old.is_board_member;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_is_board_member on public.profiles;
create trigger protect_is_board_member
  before update on public.profiles
  for each row
  execute function public.protect_is_board_member();
