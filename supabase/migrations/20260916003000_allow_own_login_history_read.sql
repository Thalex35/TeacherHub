drop policy if exists activity_events_read_own on public.activity_events;
create policy activity_events_read_own on public.activity_events
  for select to authenticated
  using (user_id = auth.uid());
