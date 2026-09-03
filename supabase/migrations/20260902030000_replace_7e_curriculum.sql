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
    'Computer & Laboratory Fundamentals',
    'Keyboarding & Typing',
    'Internet & Digital Safety',
    'Windows & File Management',
    'Microsoft Word',
    'Microsoft PowerPoint'
  ];
  unit_descriptions text[] := array[
    'Students discover the computer laboratory, learn what a computer is, identify basic components, and learn responsible laboratory behavior.',
    'Students develop keyboard familiarity, proper typing posture, finger positioning, accuracy, and speed through repeated practical exercises.',
    'Students learn the Internet, search techniques, downloading, bookmarks, and responsible digital safety habits.',
    'Students learn Windows fundamentals, files, folders, file operations, search, and the Recycle Bin.',
    'Students learn to create, edit, format, and organize documents using Microsoft Word.',
    'Students learn to create, design, and present visual information using Microsoft PowerPoint.'
  ];
begin
  create temporary table curriculum_catalog (
    topic_order int,
    unit_order int,
    topic_title text,
    lesson_titles text[]
  ) on commit drop;

  insert into curriculum_catalog values
    (1, 1, 'Discovering the Computer', array['What Is a Computer?','What Can a Computer Do?','Main Parts of a Computer','Input and Output Devices']),
    (2, 1, 'Computer Laboratory Rules', array['Computer Laboratory Rules','Proper Computer Handling','Starting and Shutting Down a Computer Correctly','Responsible Use of School Computers']),
    (3, 2, 'Keyboard Fundamentals', array['Understanding the Keyboard','Keyboard Zones','Alphabet Keys','Number Keys','Special Keys','Using Keyboard Keys Together']),
    (4, 2, 'Proper Typing Technique', array['Correct Sitting Position','Hand and Finger Position','Home Row Position','Typing Without Looking at the Keyboard','Accuracy Before Speed']),
    (5, 2, 'Typing Master Practice', array['Typing Master Lesson 1','Typing Master Lesson 2','Typing Master Lesson 3','Typing Master Lesson 4','Typing Master Lesson 5','Typing Master Lesson 6','Typing Master Lesson 7','Typing Master Lesson 8','Typing Master Lesson 9','Typing Master Lesson 10','Typing Master Lesson 11','Typing Master Lesson 12']),
    (6, 2, 'Typing Assessment', array['Final Typing Assessment']),
    (7, 3, 'Understanding the Internet', array['What Is the Internet?','What Is a Website?','What Is a Web Browser?','Browser Interface','Address Bar','Tabs and Basic Navigation']),
    (8, 3, 'Internet Search', array['Search Engines','Using Keywords','Effective Internet Searches','Evaluating Search Results','Basic Source Awareness']),
    (9, 3, 'Downloading & Bookmarks', array['What Is a Download?','Downloading a File','Finding Downloaded Files','Creating Bookmarks','Managing Bookmarks']),
    (10, 3, 'Digital Safety', array['Personal Information Online','Strong Passwords','Suspicious Links','Online Scams','Safe Browsing','Responsible Online Behavior']),
    (11, 4, 'Windows Fundamentals', array['What Is an Operating System?','The Windows Desktop','The Start Menu','The Windows Taskbar','Windows and Applications','Basic Windows Personalization']),
    (12, 4, 'Files & Folders', array['What Is a File?','What Is a Folder?','File Extensions','File Explorer','Creating Folders','Organizing Folders']),
    (13, 4, 'Managing Files', array['Selecting Files','Copying Files','Moving Files','Renaming Files','Deleting Files']),
    (14, 4, 'Search & Recycle Bin', array['Searching for Files','The Recycle Bin','Restoring Deleted Files','Permanently Deleting Files']),
    (15, 5, 'Word Fundamentals', array['What Is Microsoft Word?','Microsoft Word Interface','Creating a Word Document','Typing and Editing Text in Word','Saving a Word Document','Opening an Existing Word Document']),
    (16, 5, 'Text Formatting', array['Selecting Text','Fonts and Font Size','Bold, Italic, and Underline','Text Color','Text Alignment','Paragraph Formatting','Complete Text Formatting Exercise']),
    (17, 5, 'Inserting Elements', array['Inserting Images','Image Positioning','Creating Tables','Using Shapes','Basic Document Layout']),
    (18, 5, 'Word Project', array['Microsoft Word Final Project']),
    (19, 6, 'PowerPoint Fundamentals', array['What Is Microsoft PowerPoint?','PowerPoint Interface','Creating Slides','Adding Text to Slides','Creating a Simple Presentation']),
    (20, 6, 'Presentation Design', array['PowerPoint Themes','Colors in Presentations','Fonts in Presentations','Presentation Backgrounds','Slide Layouts','Good Presentation Design']),
    (21, 6, 'Multimedia', array['Inserting Images in PowerPoint','Using Shapes in PowerPoint','Tables in PowerPoint','Transitions','Combining Multimedia Elements']),
    (22, 6, 'Final Presentation Project', array['Microsoft PowerPoint Final Project and Presentation']);

  for class_record in
    select id, owner_id from public.classes where lower(name) = '7e'
  loop
    delete from public.units where class_id = class_record.id;

    for unit_record in
      select n, unit_titles[n] as title, unit_descriptions[n] as description
      from generate_series(1, 6) as n
    loop
      insert into public.units (owner_id, class_id, title, description, position, is_active)
      values (class_record.owner_id, class_record.id, 'Unit ' || (unit_record.n - 1) || ' — ' || unit_record.title,
              unit_record.description, unit_record.n, true)
      returning id into unit_id;

      for topic_record in
        select catalog.*, row_number() over (order by topic_order) as topic_number
        from curriculum_catalog catalog
        where unit_order = unit_record.n
        order by topic_order
      loop
        insert into public.topics (owner_id, unit_id, title, description, position, is_active)
        values (class_record.owner_id, unit_id,
                'Topic ' || (unit_record.n - 1) || '.' || topic_record.topic_number || ' — ' || topic_record.topic_title,
                'Structured 7e Informatics topic: ' || topic_record.topic_title || '.',
                topic_record.topic_number, true)
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
            class_record.owner_id, class_record.id, unit_id, topic_id, lesson_title,
            'Students develop practical 7e Informatics skills through the lesson: ' || lesson_title || '.',
            'Understand the key ideas of ' || lesson_title || '; identify the main concepts; and apply the skill in a practical computer activity.',
            'This lesson introduces ' || lesson_title || ' and connects the concept to responsible, practice-oriented computer use.',
            'Students complete a guided computer-laboratory activity related to ' || lesson_title || '.',
            'Complete the assigned practice for ' || lesson_title || ' and demonstrate the expected skill.',
            'Use beginner-friendly explanations, supervised practice, and examples available in the laboratory.',
            120, 30, 30, 30, 30, 'planned', lesson_position, true
          );
        end loop;
      end loop;
    end loop;
  end loop;
end $$;