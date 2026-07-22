-- OneBlock — migration 017: fix "User already registered" after admin deletes a resident
--
-- The admin dashboard hard-deletes accounts via supabase.auth.admin.deleteUser(),
-- which removes the auth.users row (and should cascade-delete auth.identities
-- with it). On some projects a stale auth.identities row can survive that
-- delete, which blocks a fresh signup with the same email ("User already
-- registered") even though the account is gone. This RPC lets the admin
-- server explicitly purge any identities left behind for an email, as a
-- belt-and-suspenders cleanup run right after every account delete.
--
-- Run this once in the Supabase SQL Editor. Safe to re-run.

create or replace function public.purge_orphaned_auth_identities(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.identities
  where lower(email) = lower(target_email)
    and user_id not in (select id from auth.users);
end;
$$;

-- service_role only — this reaches into auth internals and must never be
-- callable from the app itself.
revoke all on function public.purge_orphaned_auth_identities(text) from public, anon, authenticated;
grant execute on function public.purge_orphaned_auth_identities(text) to service_role;
