
-- ============ helper ============
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql set search_path = public;

-- ============ core entities ============
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  full_name text not null,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.teachers(id) on delete set null,
  name text not null,
  code text,
  color text not null default '#2563eb',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_years_dates check (end_date > start_date)
);

create table public.academic_periods (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'upcoming',
  sort_order int not null default 0,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint academic_periods_dates check (end_date >= start_date),
  constraint academic_periods_status check (status in ('upcoming','active','closed'))
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  teacher_id uuid references public.teachers(id) on delete set null,
  name text not null,
  section text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  student_code text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint students_status check (status in ('active','inactive')),
  constraint students_code_unique unique (student_code)
);

-- ============ curriculum ============
create table public.units (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null,
  description text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  description text,
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  title text not null,
  description text,
  objectives text,
  theory text,
  practical text,
  assignment_section text,
  notes text,
  estimated_minutes int not null default 120,
  theory_minutes int not null default 30,
  demo_minutes int not null default 30,
  assignment_minutes int not null default 30,
  review_minutes int not null default 30,
  planned_date date,
  status text not null default 'planned',
  position int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_status check (status in ('planned','in_progress','completed','skipped'))
);

-- ============ evaluations & grades ============
create table public.evaluation_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  period_id uuid references public.academic_periods(id) on delete set null,
  evaluation_type_id uuid not null references public.evaluation_types(id) on delete restrict,
  unit_id uuid references public.units(id) on delete set null,
  topic_id uuid references public.topics(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  description text,
  instructions text,
  date date not null default current_date,
  max_grade numeric(6,2) not null default 10,
  weight numeric(6,2) not null default 1,
  status text not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessments_max_grade check (max_grade > 0),
  constraint assessments_status check (status in ('planned','graded','archived'))
);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  score numeric(6,2),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grades_unique unique (assessment_id, student_id),
  constraint grades_non_negative check (score is null or score >= 0)
);

create or replace function public.validate_grade() returns trigger as $$
declare m numeric;
begin
  select max_grade into m from public.assessments where id = new.assessment_id;
  if new.score is not null and new.score > m then
    raise exception 'Grade % exceeds the maximum grade of % for this assessment', new.score, m;
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger grades_validate before insert or update on public.grades
for each row execute function public.validate_grade();

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  session_date date not null,
  status text not null default 'present',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_status check (status in ('present','absent','late','excused')),
  constraint attendance_unique unique (student_id, session_date)
);

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  event_date date not null,
  start_time time,
  end_time time,
  event_type text not null default 'class',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grade_weights (
  id uuid primary key default gen_random_uuid(),
  period_id uuid references public.academic_periods(id) on delete cascade,
  evaluation_type_id uuid not null references public.evaluation_types(id) on delete cascade,
  weight numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grade_weights_range check (weight >= 0 and weight <= 100),
  constraint grade_weights_unique unique (period_id, evaluation_type_id)
);

create table public.final_grade_overrides (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  period_id uuid not null references public.academic_periods(id) on delete cascade,
  value numeric(6,2) not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint final_override_unique unique (student_id, period_id),
  constraint final_override_non_negative check (value >= 0)
);

create table public.app_settings (
  id boolean primary key default true,
  school_name text not null default 'My School',
  school_info text,
  teacher_name text not null default 'Teacher',
  current_year_id uuid references public.academic_years(id) on delete set null,
  current_period_id uuid references public.academic_periods(id) on delete set null,
  default_max_grade numeric(6,2) not null default 10,
  decimal_precision int not null default 2,
  allow_grade_override boolean not null default true,
  is_demo_data boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

-- ============ updated_at triggers ============
do $$
declare t text;
begin
  foreach t in array array['teachers','subjects','academic_years','academic_periods','classes','students','units','topics','lessons','evaluation_types','assessments','grades','attendance','calendar_events','grade_weights','final_grade_overrides','app_settings']
  loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ============ grants + RLS ============
do $$
declare t text;
begin
  foreach t in array array['teachers','subjects','academic_years','academic_periods','classes','students','units','topics','lessons','evaluation_types','assessments','grades','attendance','calendar_events','grade_weights','final_grade_overrides','app_settings']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using (true) with check (true)', t||'_authenticated_all', t);
  end loop;
end $$;

create index on public.students (class_id);
create index on public.assessments (class_id, period_id);
create index on public.grades (student_id);
create index on public.attendance (class_id, session_date);
create index on public.lessons (class_id);

-- ============ seed / demo data ============
do $$
declare
  v_teacher uuid; v_subject uuid; v_year uuid;
  v_p1 uuid; v_p2 uuid; v_p3 uuid;
  v_class uuid; v_unit uuid; v_topic uuid; v_lesson uuid; v_assess uuid;
  et_assignment uuid; et_quiz uuid; et_test uuid; et_exam uuid; et_project uuid; et_practical uuid;
  class_names text[] := array['7e','8e','9e','NS1','NS2','NS3','NS4'];
  cname text; i int; j int; k int; n int;
  firsts text[] := array['Jean','Marie','David','Nadege','Pierre','Rose','Wilner','Fabiola','Kenson','Darline','Jonas','Sophonie','Ricardo','Mirlande','Emmanuel','Guerlande','Steeve','Lourdes','Frantz','Islande','Kervens','Naomie','Josue','Chedeline','Michel','Roseline','Berthony','Esther','Widlyn','Carline','Peterson','Vanessa'];
  lasts text[] := array['Pierre','Joseph','Louis','Charles','Baptiste','Jean-Baptiste','Dorvil','Cadet','Saint-Fleur','Merisier','Alcide','Georges','Desir','Fenelon','Toussaint','Lafontant','Beauvoir','Estime','Casimir','Noel','Julien','Antoine','Bellevue','Dieujuste','Sanon','Petit-Frere','Moise','Delva','Auguste','Raymond','Cherenfant','Ulysse'];
  unit_titles text[] := array['Introduction to Computing','Operating Systems & Files','Word Processing','Spreadsheets','Internet & Safety','Algorithms & Programming'];
  topic_titles text[] := array['Hardware components','Software basics','Practical workshop'];
  seed_score numeric;
  stu record; sdate date;
begin
  insert into public.teachers (full_name, email) values ('Prof. Jean-Robert Etienne','teacher@teacherhub.app') returning id into v_teacher;
  insert into public.subjects (teacher_id, name, code, color) values (v_teacher,'Informatics','INFO','#2563eb') returning id into v_subject;
  insert into public.academic_years (name, start_date, end_date, is_current) values ('2025-2026','2025-09-01','2026-06-30', true) returning id into v_year;

  insert into public.academic_periods (academic_year_id,name,start_date,end_date,status,sort_order,is_current)
    values (v_year,'Control 1','2025-09-01','2025-11-30','closed',1,false) returning id into v_p1;
  insert into public.academic_periods (academic_year_id,name,start_date,end_date,status,sort_order,is_current)
    values (v_year,'Control 2','2025-12-01','2026-03-15','active',2,true) returning id into v_p2;
  insert into public.academic_periods (academic_year_id,name,start_date,end_date,status,sort_order,is_current)
    values (v_year,'Final','2026-03-16','2026-06-30','upcoming',3,false) returning id into v_p3;

  insert into public.evaluation_types (name, code, is_system) values
    ('Assignment','assignment',true) returning id into et_assignment;
  insert into public.evaluation_types (name, code, is_system) values ('Quiz','quiz',true) returning id into et_quiz;
  insert into public.evaluation_types (name, code, is_system) values ('Test','test',true) returning id into et_test;
  insert into public.evaluation_types (name, code, is_system) values ('Exam','exam',true) returning id into et_exam;
  insert into public.evaluation_types (name, code, is_system) values ('Project','project',true) returning id into et_project;
  insert into public.evaluation_types (name, code, is_system) values ('Practical evaluation','practical',true) returning id into et_practical;

  insert into public.grade_weights (period_id, evaluation_type_id, weight) values
    (null, et_assignment, 40),(null, et_quiz, 20),(null, et_test, 20),(null, et_exam, 20),
    (null, et_project, 0),(null, et_practical, 0);

  insert into public.app_settings (id, school_name, school_info, teacher_name, current_year_id, current_period_id)
    values (true,'College Saint-Esprit','Private secondary school - Informatics department','Prof. Jean-Robert Etienne', v_year, v_p2);

  for i in 1..array_length(class_names,1) loop
    cname := class_names[i];
    insert into public.classes (academic_year_id, subject_id, teacher_id, name, sort_order)
      values (v_year, v_subject, v_teacher, cname, i) returning id into v_class;

    -- students
    n := 8 + (i % 4);
    for j in 1..n loop
      insert into public.students (class_id, first_name, last_name, student_code)
        values (v_class,
                firsts[1 + ((i*5 + j*3) % array_length(firsts,1))],
                lasts[1 + ((i*7 + j*5) % array_length(lasts,1))],
                'STU-' || cname || '-' || lpad(j::text,2,'0'));
    end loop;

    -- curriculum: 2 units x 2 topics x 2 lessons
    for j in 1..2 loop
      insert into public.units (class_id, title, description, position)
        values (v_class, unit_titles[1 + ((i + j) % array_length(unit_titles,1))],
                'Core unit for class ' || cname, j) returning id into v_unit;
      for k in 1..2 loop
        insert into public.topics (unit_id, title, description, position)
          values (v_unit, topic_titles[1 + ((j + k) % array_length(topic_titles,1))],
                  'Topic covered in class sessions', k) returning id into v_topic;

        insert into public.lessons (class_id, unit_id, topic_id, title, description, objectives, theory, practical, assignment_section, estimated_minutes, planned_date, status, position)
          values (v_class, v_unit, v_topic,
                  'Lesson ' || j || '.' || k || ' - ' || topic_titles[1 + ((j + k) % array_length(topic_titles,1))],
                  'Two-hour session with theory, demonstration and practical work.',
                  'Understand key concepts; apply them on the computer; complete the practical exercise.',
                  'Definitions, diagrams and examples presented at the board.',
                  'Guided demonstration on the workstation followed by student practice.',
                  'Final 30 minutes: practical exercise graded out of 10.',
                  120,
                  date '2025-09-15' + ((i*14) + (j*7) + k)::int,
                  case when j = 1 then 'completed' else 'planned' end,
                  (j-1)*2 + k)
          returning id into v_lesson;

        -- one practical assignment per completed lesson
        if j = 1 then
          insert into public.assessments (class_id, period_id, evaluation_type_id, unit_id, topic_id, lesson_id, title, description, instructions, date, max_grade, status)
            values (v_class, v_p2, et_assignment, v_unit, v_topic, v_lesson,
                    'Practical exercise ' || k || ' - ' || cname,
                    'In-class practical assignment.',
                    'Complete the exercise on the workstation within 30 minutes.',
                    date '2025-12-05' + (i*3 + k)::int, 10, 'graded')
            returning id into v_assess;

          for stu in select id from public.students where class_id = v_class loop
            seed_score := round((5 + ((abs(hashtext(stu.id::text || v_assess::text)) % 50) / 10.0))::numeric, 1);
            insert into public.grades (assessment_id, student_id, score) values (v_assess, stu.id, least(seed_score,10));
          end loop;
        end if;
      end loop;
    end loop;

    -- quiz + test + exam
    insert into public.assessments (class_id, period_id, evaluation_type_id, title, date, max_grade, status)
      values (v_class, v_p2, et_quiz, 'Quiz 1 - ' || cname, date '2025-12-12' + i, 10, 'graded') returning id into v_assess;
    for stu in select id from public.students where class_id = v_class loop
      insert into public.grades (assessment_id, student_id, score)
        values (v_assess, stu.id, least(round((4 + ((abs(hashtext(stu.id::text || 'quiz')) % 60) / 10.0))::numeric,1),10));
    end loop;

    insert into public.assessments (class_id, period_id, evaluation_type_id, title, date, max_grade, status)
      values (v_class, v_p2, et_test, 'Test 1 - ' || cname, date '2026-01-20' + i, 10, 'graded') returning id into v_assess;
    for stu in select id from public.students where class_id = v_class loop
      insert into public.grades (assessment_id, student_id, score)
        values (v_assess, stu.id, least(round((4.5 + ((abs(hashtext(stu.id::text || 'test')) % 55) / 10.0))::numeric,1),10));
    end loop;

    insert into public.assessments (class_id, period_id, evaluation_type_id, title, date, max_grade, status)
      values (v_class, v_p2, et_exam, 'Period exam - ' || cname, date '2026-03-10' + i, 10, 'planned');

    -- attendance for 4 sessions
    for k in 0..3 loop
      sdate := date '2026-01-05' + (k*7 + i);
      for stu in select id from public.students where class_id = v_class loop
        insert into public.attendance (class_id, student_id, session_date, status)
          values (v_class, stu.id, sdate,
            case (abs(hashtext(stu.id::text || sdate::text)) % 12)
              when 0 then 'absent' when 1 then 'late' when 2 then 'excused' else 'present' end);
      end loop;
    end loop;

    -- calendar events
    insert into public.calendar_events (class_id, subject_id, title, description, event_date, start_time, end_time, event_type)
      values (v_class, v_subject, 'Informatics session - ' || cname, 'Weekly two-hour session', current_date + i, '08:00', '10:00', 'class'),
             (v_class, v_subject, 'Period exam - ' || cname, 'End of period evaluation', date '2026-03-10' + i, '08:00', '10:00', 'exam');
  end loop;
end $$;
