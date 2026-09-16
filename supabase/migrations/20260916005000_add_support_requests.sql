create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(trim(subject)) between 2 and 160),
  message text not null check (char_length(trim(message)) between 2 and 5000),
  screenshot_path text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_created_at_idx on public.support_requests(created_at desc);
alter table public.support_requests enable row level security;

drop policy if exists support_requests_insert_own on public.support_requests;
create policy support_requests_insert_own on public.support_requests for insert to authenticated with check (user_id = auth.uid());
drop policy if exists support_requests_read_own on public.support_requests;
create policy support_requests_read_own on public.support_requests for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists support_requests_admin_update on public.support_requests;
create policy support_requests_admin_update on public.support_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public) values ('support-screenshots', 'support-screenshots', false)
on conflict (id) do nothing;

drop policy if exists support_screenshots_insert_own on storage.objects;
create policy support_screenshots_insert_own on storage.objects for insert to authenticated with check (bucket_id = 'support-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists support_screenshots_read on storage.objects;
create policy support_screenshots_read on storage.objects for select to authenticated using (bucket_id = 'support-screenshots' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));