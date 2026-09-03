do $$
declare
  target_owner constant uuid := '3344ba75-4568-4d37-b7fc-e338324edc45';
  class_record record;
  unit_record record;
  topic_record record;
  lesson_title text;
  unit_id uuid;
  topic_id uuid;
  lesson_position int;
  unit_titles text[] := array[
    'Advanced Microsoft Word',
    'Microsoft Excel Fundamentals',
    'Cybersecurity and Digital Responsibility',
    'Integrated Digital Project'
  ];
  unit_descriptions text[] := array[
    'Students create structured, professional multi-page documents using advanced Microsoft Word tools.',
    'Students organize data, calculate values, use spreadsheet functions, and create useful charts in Microsoft Excel.',
    'Students practice account protection, privacy, phishing awareness, safe browsing, and responsible digital behavior.',
    'Students combine Word, Excel, and PowerPoint to plan, create, and present a complete digital project.'
  ];
begin
  create temporary table curriculum_catalog (
    unit_order int,
    topic_order int,
    topic_title text,
    lesson_titles text[]
  ) on commit drop;

  insert into curriculum_catalog values
    (1, 1, 'Professional Document Creation', array['Review of Microsoft Word','Styles and Professional Formatting']),
    (1, 2, 'Page Design', array['Headers, Footers, and Page Numbers','Page Layout and Sections']),
    (1, 3, 'References and Long Documents', array['Tables of Contents','References and Document Organization']),
    (1, 4, 'Advanced Tables and Document Design', array['Advanced Tables','Professional Word Document Project']),
    (2, 1, 'Spreadsheet Fundamentals', array['Introduction to Excel','Entering and Formatting Data']),
    (2, 2, 'Excel Formulas and Functions', array['Basic Formulas','SUM and AVERAGE','MIN, MAX, and Percentages']),
    (2, 3, 'Excel Tables and Charts', array['Creating Excel Tables','Creating Charts','Excel Mini Project']),
    (3, 1, 'Account Security', array['Strong Passwords and Account Protection','Phishing and Online Scams']),
    (3, 2, 'Privacy and Digital Footprint', array['Online Privacy','Digital Footprint and Online Reputation']),
    (3, 3, 'Safe Browsing', array['Safe Websites and Downloads','Cybersecurity Review and Practical Assessment']),
    (4, 1, 'Project Planning', array['Planning an Integrated Digital Project']),
    (4, 2, 'Word + Excel Integration', array['Creating the Project Report and Data']),
    (4, 3, 'PowerPoint Presentation', array['Creating the Project Presentation','Final Integrated Project Presentation']);

  for class_record in
    select id, owner_id
    from public.classes
    where lower(name) = '9e'
      and owner_id = target_owner
  loop
    delete from public.lessons where class_id = class_record.id;
    delete from public.units where class_id = class_record.id;

    for unit_record in
      select n, unit_titles[n] as title, unit_descriptions[n] as description
      from generate_series(1, 4) as n
    loop
      insert into public.units (owner_id, class_id, title, description, position, is_active)
      values (
        class_record.owner_id,
        class_record.id,
        'Unit ' || unit_record.n || ' - ' || unit_record.title,
        unit_record.description,
        unit_record.n,
        true
      )
      returning id into unit_id;

      for topic_record in
        select catalog.*, row_number() over (order by topic_order) as topic_number
        from curriculum_catalog catalog
        where unit_order = unit_record.n
        order by topic_order
      loop
        insert into public.topics (owner_id, unit_id, title, description, position, is_active)
        values (
          class_record.owner_id,
          unit_id,
          'Topic ' || unit_record.n || '.' || topic_record.topic_number || ' - ' || topic_record.topic_title,
          'Practical 9e Informatics topic: ' || topic_record.topic_title || '.',
          topic_record.topic_number,
          true
        )
        returning id into topic_id;

        lesson_position := 0;
        foreach lesson_title in array topic_record.lesson_titles
        loop
          lesson_position := lesson_position + 1;
          insert into public.lessons (
            owner_id, class_id, unit_id, topic_id, title, description, objectives, theory,
            practical, assignment_section, notes, estimated_minutes, theory_minutes,
            demo_minutes, assignment_minutes, review_minutes, status, position, is_active
          ) values (
            class_record.owner_id,
            class_record.id,
            unit_id,
            topic_id,
            lesson_title,
            'Students build advanced 9e skills through a focused practical lesson on ' || lower(lesson_title) || '.',
            'Understand the main techniques; apply them independently; evaluate the result; and improve the quality, accuracy, or safety of the work.',
            'The lesson explains ' || lower(lesson_title) || ' and connects it to productivity, data management, digital responsibility, or project creation.',
            'Students complete a supervised computer activity using the appropriate Word, Excel, PowerPoint, Windows, or browser tools.',
            'Complete the practical ' || lower(lesson_title) || ' task during class and save or present the result as instructed.',
            'Keep the work practice-oriented and use fictional data or safe teacher-provided examples where appropriate.',
            120, 30, 30, 30, 30, 'planned', lesson_position, true
          );
        end loop;
      end loop;
    end loop;
  end loop;
end $$;