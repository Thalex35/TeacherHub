create table public.teacher_control_sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  week_number integer not null default 1,
  session_date date not null,
  entry_time time not null,
  exit_time time not null,
  theme text not null,
  objectives text not null,
  devoir_title text not null default '',
  devoir_date date,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_control_sessions_week_number check (week_number between 1 and 53),
  constraint teacher_control_sessions_month_matches_date check (month = to_char(session_date, 'YYYY-MM')),
  constraint teacher_control_sessions_time_order check (exit_time > entry_time),
  constraint teacher_control_sessions_unique unique (teacher_id, class_id, subject_id, session_date, entry_time)
);

alter table public.teacher_control_sessions enable row level security;

create policy teacher_control_sessions_owner_only
  on public.teacher_control_sessions
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create index teacher_control_sessions_month_idx
  on public.teacher_control_sessions (owner_id, teacher_id, class_id, subject_id, month, session_date);

create or replace function public.validate_teacher_control_session_owner()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  teacher_owner uuid;
  class_owner uuid;
  class_subject uuid;
  class_teacher uuid;
  subject_owner uuid;
  subject_teacher uuid;
begin
  select owner_id into teacher_owner from public.teachers where id = new.teacher_id;
  select owner_id, subject_id, teacher_id
    into class_owner, class_subject, class_teacher
    from public.classes where id = new.class_id;
  select owner_id, teacher_id into subject_owner, subject_teacher
    from public.subjects where id = new.subject_id;

  if new.owner_id is distinct from auth.uid()
    or teacher_owner is distinct from auth.uid()
    or class_owner is distinct from auth.uid()
    or subject_owner is distinct from auth.uid() then
    raise exception 'Teacher control sheet records must use records from your workspace';
  end if;

  if class_subject is distinct from new.subject_id then
    raise exception 'The selected subject does not belong to the selected class';
  end if;

  if (class_teacher is not null and class_teacher <> new.teacher_id)
    or (subject_teacher is not null and subject_teacher <> new.teacher_id) then
    raise exception 'The selected teacher is not assigned to this class and subject';
  end if;

  return new;
end;
$$;

create trigger teacher_control_sessions_validate_owner
before insert or update on public.teacher_control_sessions
for each row execute function public.validate_teacher_control_session_owner();

create trigger teacher_control_sessions_set_updated_at
before update on public.teacher_control_sessions
for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
