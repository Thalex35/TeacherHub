create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Only approved administrators can delete users';
  end if;

  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'Administrators cannot delete their own account';
  end if;

  delete from public.grades where assessment_id in (select id from public.assessments where owner_id = target_user_id);
  delete from public.attendance where owner_id = target_user_id;
  delete from public.assessments where owner_id = target_user_id;
  delete from public.calendar_events where owner_id = target_user_id;
  delete from public.lessons where owner_id = target_user_id;
  delete from public.topics where owner_id = target_user_id;
  delete from public.units where owner_id = target_user_id;
  delete from public.students where owner_id = target_user_id;
  delete from public.grade_weights where owner_id = target_user_id;
  delete from public.final_grade_overrides where owner_id = target_user_id;
  delete from public.academic_periods where owner_id = target_user_id;
  delete from public.classes where owner_id = target_user_id;
  delete from public.academic_years where owner_id = target_user_id;
  delete from public.subjects where owner_id = target_user_id;
  delete from public.evaluation_types where owner_id = target_user_id;
  delete from public.app_settings where owner_id = target_user_id;
  delete from public.teachers where owner_id = target_user_id or user_id = target_user_id;
  delete from auth.users where id = target_user_id;
  if not found then
    raise exception 'User account was not found';
  end if;
end;
$$;

revoke all on function public.admin_delete_user(uuid) from public;
grant execute on function public.admin_delete_user(uuid) to authenticated;
