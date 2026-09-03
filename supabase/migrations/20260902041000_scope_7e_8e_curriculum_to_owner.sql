do $$
declare
  target_owner constant uuid := '3344ba75-4568-4d37-b7fc-e338324edc45';
begin
  -- Remove only the curriculum created for 7e/8e outside the requested owner.
  -- Lessons are deleted first because topic_id uses ON DELETE SET NULL.
  delete from public.lessons lesson
  using public.classes class_record
  where lesson.class_id = class_record.id
    and lower(class_record.name) in ('7e', '8e')
    and class_record.owner_id is distinct from target_owner;

  delete from public.units unit_record
  using public.classes class_record
  where unit_record.class_id = class_record.id
    and lower(class_record.name) in ('7e', '8e')
    and class_record.owner_id is distinct from target_owner;
end $$;