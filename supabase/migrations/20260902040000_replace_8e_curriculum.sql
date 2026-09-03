do $$
declare
  class_record record;
  unit_record record;
  topic_record record;
  lesson_title text;
  unit_id uuid;
  topic_id uuid;
  lesson_position int;
  unit_titles text[] := array[
    'Keyboarding and Typing',
    'Internet and Digital Safety',
    'Windows and File Management',
    'Microsoft Word',
    'Microsoft PowerPoint'
  ];
  unit_descriptions text[] := array[
    'Students improve typing speed, accuracy, posture, and technique through practical computer exercises.',
    'Students use browsers and search tools efficiently while developing safe and responsible Internet habits.',
    'Students work independently with Windows, File Explorer, folders, file operations, search, and recovery tools.',
    'Students create, format, organize, and prepare practical documents using Microsoft Word.',
    'Students create, design, enrich, and present practical slide presentations using Microsoft PowerPoint.'
  ];
begin
  create temporary table curriculum_catalog (
    unit_order int,
    topic_order int,
    topic_title text,
    lesson_titles text[]
  ) on commit drop;

  insert into curriculum_catalog values
    (1, 1, 'Typing Review and Accuracy', array['Typing Review and Correct Finger Position','Typing Speed and Accuracy']),
    (1, 2, 'Typing Practice and Assessment', array['Extended Typing Practice','Typing Performance Assessment']),
    (2, 1, 'Web Browsing', array['Efficient Web Navigation']),
    (2, 2, 'Effective Internet Research', array['Search Techniques and Keywords','Evaluating Online Information']),
    (2, 3, 'Online Safety', array['Passwords, Privacy, and Safe Internet Use']),
    (3, 1, 'Windows Environment', array['Windows Desktop and System Navigation']),
    (3, 2, 'File and Folder Organization', array['Creating and Organizing Folders','Copying, Moving, Renaming, and Deleting Files','Searching for Files and Using the Recycle Bin']),
    (3, 3, 'File Types and Storage', array['File Extensions and Common File Types']),
    (4, 1, 'Word Fundamentals', array['Microsoft Word Interface and Basic Tools']),
    (4, 2, 'Text Formatting', array['Fonts, Text Formatting, and Alignment','Paragraphs, Spacing, and Lists']),
    (4, 3, 'Inserting Elements', array['Images and Shapes in Word','Tables in Word']),
    (4, 4, 'Document Layout', array['Page Layout and Document Preparation','Word Project']),
    (5, 1, 'Presentation Fundamentals', array['Introduction to PowerPoint','Slide Design and Formatting']),
    (5, 2, 'Multimedia and Presentation', array['Images, Shapes, Tables, and Transitions','Final PowerPoint Project']);

  for class_record in
    select id, owner_id from public.classes where lower(name) = '8e'
  loop
    -- Lessons must be removed first because topic_id uses ON DELETE SET NULL.
    delete from public.lessons where class_id = class_record.id;
    delete from public.units where class_id = class_record.id;

    for unit_record in
      select n, unit_titles[n] as title, unit_descriptions[n] as description
      from generate_series(1, 5) as n
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
          'Practical 8e Informatics topic: ' || topic_record.topic_title || '.',
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
            'Students develop practical 8e Informatics skills through ' || lower(lesson_title) || '.',
            'Review the key concepts; apply the skill independently; and improve accuracy, organization, or presentation quality through practice.',
            'The lesson explains ' || lower(lesson_title) || ', its purpose, and the techniques needed to use the computer effectively and responsibly.',
            'Students complete a guided computer activity based on ' || lower(lesson_title) || ' using the available applications and tools.',
            'Complete the practical ' || lower(lesson_title) || ' exercise during class and save the result in the assigned folder.',
            'Keep the activity practical and support students who need additional guided practice.',
            120,
            30,
            30,
            30,
            30,
            'planned',
            lesson_position,
            true
          );
        end loop;
      end loop;
    end loop;
  end loop;
end $$;