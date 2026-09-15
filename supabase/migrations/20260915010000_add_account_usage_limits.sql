alter table public.profiles
  add column if not exists max_students integer not null default 100,
  add column if not exists max_classes integer not null default 20,
  add column if not exists max_storage_bytes bigint not null default 1073741824;

create or replace function public.admin_account_usage()
returns table (
  user_id uuid,
  students_count bigint,
  classes_count bigint,
  storage_bytes bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select
    p.id,
    (select count(*) from public.students s where s.owner_id = p.id),
    (select count(*) from public.classes c where c.owner_id = p.id),
    coalesce((select sum(ts.file_size) from public.topic_slides ts where ts.owner_id = p.id), 0)::bigint
  from public.profiles p
  order by p.created_at desc;
end;
$$;

revoke all on function public.admin_account_usage() from public;
grant execute on function public.admin_account_usage() to authenticated;

create or replace function public.enforce_account_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  student_limit integer;
  class_limit integer;
  storage_limit bigint;
  current_count bigint;
  current_storage bigint;
begin
  if tg_table_name = 'students' and tg_op in ('INSERT', 'UPDATE') then
    select max_students into student_limit from public.profiles where id = new.owner_id;
    select count(*) into current_count from public.students where owner_id = new.owner_id and id <> new.id;
    if current_count >= coalesce(student_limit, 100) then
      raise exception 'Student limit reached for this account';
    end if;
  elsif tg_table_name = 'classes' and tg_op in ('INSERT', 'UPDATE') then
    select max_classes into class_limit from public.profiles where id = new.owner_id;
    select count(*) into current_count from public.classes where owner_id = new.owner_id and id <> new.id;
    if current_count >= coalesce(class_limit, 20) then
      raise exception 'Class limit reached for this account';
    end if;
  elsif tg_table_name = 'topic_slides' and tg_op in ('INSERT', 'UPDATE') then
    select max_storage_bytes into storage_limit from public.profiles where id = new.owner_id;
    select coalesce(sum(file_size), 0) into current_storage
    from public.topic_slides
    where owner_id = new.owner_id and id <> new.id;
    if current_storage + new.file_size > coalesce(storage_limit, 1073741824) then
      raise exception 'Storage limit reached for this account';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists students_enforce_account_limits on public.students;
create trigger students_enforce_account_limits
before insert or update on public.students
for each row execute function public.enforce_account_limits();

drop trigger if exists classes_enforce_account_limits on public.classes;
create trigger classes_enforce_account_limits
before insert or update on public.classes
for each row execute function public.enforce_account_limits();

drop trigger if exists topic_slides_enforce_account_limits on public.topic_slides;
create trigger topic_slides_enforce_account_limits
before insert or update on public.topic_slides
for each row execute function public.enforce_account_limits();