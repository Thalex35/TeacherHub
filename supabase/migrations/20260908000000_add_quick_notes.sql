create table if not exists public.quick_notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  text text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quick_notes_owner_id_idx on public.quick_notes(owner_id);

alter table public.quick_notes enable row level security;

drop policy if exists quick_notes_owner_only on public.quick_notes;
create policy quick_notes_owner_only on public.quick_notes
for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create or replace function public.set_quick_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quick_notes_updated_at on public.quick_notes;
create trigger quick_notes_updated_at
before update on public.quick_notes
for each row execute function public.set_quick_notes_updated_at();
