alter table public.profiles add column if not exists last_seen_at timestamptz;

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('login', 'app_access')),
  created_at timestamptz not null default now()
);

create index if not exists activity_events_user_idx on public.activity_events(user_id, created_at desc);
create index if not exists activity_events_created_idx on public.activity_events(created_at desc);

alter table public.activity_events enable row level security;

drop policy if exists activity_events_insert_own on public.activity_events;
create policy activity_events_insert_own on public.activity_events
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists activity_events_admin_read on public.activity_events;
create policy activity_events_admin_read on public.activity_events
  for select to authenticated using (public.is_admin());

create or replace function public.record_activity(activity_type text)
returns void language plpgsql security invoker set search_path = public
as $$
begin
  if activity_type not in ('login', 'app_access') then
    raise exception 'Unsupported activity type';
  end if;
  insert into public.activity_events (user_id, event_type) values (auth.uid(), activity_type);
  update public.profiles set last_seen_at = now() where id = auth.uid();
end;
$$;

grant execute on function public.record_activity(text) to authenticated;

create or replace function public.admin_activity_summary()
returns table (active_today bigint, active_week bigint, logins_today bigint, registrations_today bigint, registrations_week bigint)
language sql security definer set search_path = public
as $$
  select
    (select count(distinct user_id) from public.activity_events where created_at >= current_date),
    (select count(distinct user_id) from public.activity_events where created_at >= now() - interval '7 days'),
    (select count(*) from public.activity_events where event_type = 'login' and created_at >= current_date),
    (select count(*) from public.profiles where created_at >= current_date),
    (select count(*) from public.profiles where created_at >= now() - interval '7 days')
  where public.is_admin();
$$;

create or replace function public.admin_recent_activity()
returns table (event_id uuid, user_id uuid, email text, full_name text, event_type text, created_at timestamptz)
language sql security definer set search_path = public
as $$
  select e.id, e.user_id, p.email, p.full_name, e.event_type, e.created_at
  from public.activity_events e join public.profiles p on p.id = e.user_id
  where public.is_admin() order by e.created_at desc limit 20;
$$;

revoke all on function public.admin_activity_summary() from public;
revoke all on function public.admin_recent_activity() from public;
grant execute on function public.admin_activity_summary() to authenticated;
grant execute on function public.admin_recent_activity() to authenticated;