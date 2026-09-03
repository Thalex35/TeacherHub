-- Preserve a compact demo workspace for the first existing user only.
do $$
declare
  workspace_owner uuid;
begin
  select id into workspace_owner from auth.users order by created_at limit 1;

  if workspace_owner is not null then
    update public.teachers set owner_id = workspace_owner where owner_id is null;
    update public.subjects set owner_id = workspace_owner where owner_id is null;
    update public.academic_years set owner_id = workspace_owner where owner_id is null;
    update public.academic_periods set owner_id = workspace_owner where owner_id is null;
    update public.classes set owner_id = workspace_owner where owner_id is null;
    update public.students set owner_id = workspace_owner where owner_id is null;
    update public.units set owner_id = workspace_owner where owner_id is null;
    update public.topics set owner_id = workspace_owner where owner_id is null;
    update public.lessons set owner_id = workspace_owner where owner_id is null;
    update public.evaluation_types set owner_id = workspace_owner where owner_id is null;
    update public.assessments set owner_id = workspace_owner where owner_id is null;
    update public.grades set owner_id = workspace_owner where owner_id is null;
    update public.attendance set owner_id = workspace_owner where owner_id is null;
    update public.calendar_events set owner_id = workspace_owner where owner_id is null;
    update public.grade_weights set owner_id = workspace_owner where owner_id is null;
    update public.final_grade_overrides set owner_id = workspace_owner where owner_id is null;
    update public.app_settings set owner_id = workspace_owner where owner_id is null;

    delete from public.students student
    where student.owner_id = workspace_owner
      and student.id not in (
        select id from (
          select id, row_number() over (partition by class_id order by created_at, id) as position
          from public.students where owner_id = workspace_owner
        ) ranked where position <= 3
      );
  end if;
end $$;

alter table public.students drop constraint if exists students_code_unique;
alter table public.students add constraint students_owner_code_unique unique (owner_id, student_code);

alter table public.evaluation_types drop constraint if exists evaluation_types_code_key;
alter table public.evaluation_types add constraint evaluation_types_owner_code_unique unique (owner_id, code);