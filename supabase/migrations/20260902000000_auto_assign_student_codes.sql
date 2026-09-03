create or replace function public.assign_student_code() returns trigger as $$
declare
  class_name text;
  code_prefix text;
  next_number int;
begin
  if new.student_code is not null and btrim(new.student_code) <> '' then
    return new;
  end if;

  select name into class_name from public.classes where id = new.class_id;
  if class_name is null then
    raise exception 'Cannot assign a student ID without a valid class';
  end if;

  code_prefix := 'STU-' || class_name || '-';
  perform pg_advisory_xact_lock(hashtextextended(new.class_id::text, 0));

  select coalesce(max(substring(student_code from length(code_prefix) + 1)::int), 0) + 1
    into next_number
    from public.students
   where left(student_code, length(code_prefix)) = code_prefix
     and substring(student_code from length(code_prefix) + 1) ~ '^[0-9]+$';

  new.student_code := code_prefix || lpad(next_number::text, 2, '0');
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists students_assign_code on public.students;
create trigger students_assign_code
before insert on public.students
for each row execute function public.assign_student_code();