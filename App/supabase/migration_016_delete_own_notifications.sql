-- Swiping away a notification (Today page) now permanently deletes it instead
-- of just hiding it locally for the session. Notifications were missing a
-- delete policy entirely (only select + update existed).
drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own" on public.notifications
  for delete using (profile_id = auth.uid());
