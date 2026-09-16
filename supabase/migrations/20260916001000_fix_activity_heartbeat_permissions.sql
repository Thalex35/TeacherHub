create or replace function public.record_activity(activity_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if activity_type not in ('login', 'app_access') then
    raise exception 'Unsupported activity type';
  end if;

  insert into public.activity_events (user_id, event_type)
  values (auth.uid(), activity_type);

  update public.profiles
  set last_seen_at = now()
  where id = auth.uid();
end;
$$;

revoke all on function public.record_activity(text) from public;
grant execute on function public.record_activity(text) to authenticated;
