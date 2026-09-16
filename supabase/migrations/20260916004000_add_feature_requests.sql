create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(trim(subject)) between 2 and 160),
  description text not null check (char_length(trim(description)) between 2 and 5000),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'planned', 'completed', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_requests_created_at_idx on public.feature_requests(created_at desc);
create index if not exists feature_requests_status_idx on public.feature_requests(status);

alter table public.feature_requests enable row level security;

drop policy if exists feature_requests_insert_own on public.feature_requests;
create policy feature_requests_insert_own on public.feature_requests
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists feature_requests_read_own on public.feature_requests;
create policy feature_requests_read_own on public.feature_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

drop policy if exists feature_requests_admin_update on public.feature_requests;
create policy feature_requests_admin_update on public.feature_requests
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
