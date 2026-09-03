delete from public.lessons lesson
using public.classes class_record
where lesson.class_id = class_record.id
  and lower(class_record.name) = '7e'
  and lesson.topic_id is null;