create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  account_status text not null default 'pending' check (account_status in ('pending', 'approved', 'rejected', 'suspended')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null
);

create index if not exists profiles_status_idx on public.profiles(account_status);
create index if not exists profiles_created_at_idx on public.profiles(created_at desc);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and account_status = 'approved'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.create_user_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set email = excluded.email;

  insert into public.teachers (user_id, full_name, email, owner_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email, new.id)
  on conflict do nothing;

  insert into public.app_settings (owner_id, school_name, teacher_name, is_demo_data)
  values (new.id, 'My School', coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), false);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_workspace on auth.users;
create trigger on_auth_user_created_workspace
after insert on auth.users
for each row execute function public.create_user_workspace();

insert into public.profiles (id, email, full_name, account_status)
select id, email, coalesce(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), 'approved'
from auth.users
on conflict (id) do nothing;

-- Promote your own account once in Supabase SQL Editor after applying this migration:
-- update public.profiles set role = 'admin', account_status = 'approved', approved_at = now() where email = 'your-email@example.com';