create table if not exists public.topic_slides (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  topic_id uuid not null unique references public.topics(id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists topic_slides_owner_id_idx on public.topic_slides(owner_id);
alter table public.topic_slides enable row level security;

drop policy if exists topic_slides_owner_only on public.topic_slides;
create policy topic_slides_owner_only on public.topic_slides
for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop trigger if exists topic_slides_updated_at on public.topic_slides;
create trigger topic_slides_updated_at
before update on public.topic_slides
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('topic-slides', 'topic-slides', false)
on conflict (id) do nothing;

drop policy if exists topic_slides_storage_select on storage.objects;
create policy topic_slides_storage_select on storage.objects
for select to authenticated
using (bucket_id = 'topic-slides' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists topic_slides_storage_insert on storage.objects;
create policy topic_slides_storage_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'topic-slides' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists topic_slides_storage_update on storage.objects;
create policy topic_slides_storage_update on storage.objects
for update to authenticated
using (bucket_id = 'topic-slides' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'topic-slides' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists topic_slides_storage_delete on storage.objects;
create policy topic_slides_storage_delete on storage.objects
for delete to authenticated
using (bucket_id = 'topic-slides' and (storage.foldername(name))[1] = auth.uid()::text);