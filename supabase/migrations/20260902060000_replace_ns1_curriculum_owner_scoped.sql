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
    'Digital and Web Foundations',
    'HTML Fundamentals',
    'CSS Fundamentals',
    'Final Web Development Project'
  ];
  unit_descriptions text[] := array[
    'Students connect computer systems, the Internet, and the Web to prepare for practical web development.',
    'Students build structured webpages with HTML, including text, links, images, lists, tables, forms, and semantic elements.',
    'Students style real HTML pages with CSS using selectors, typography, colors, the box model, and basic Flexbox layouts.',
    'Students plan, build, style, test, debug, and present a complete multi-page website.'
  ];
begin
  create temporary table curriculum_catalog (
    unit_order int,
    topic_order int,
    topic_title text,
    lesson_titles text[]
  ) on commit drop;

  insert into curriculum_catalog values
    (1, 1, 'Computer Systems Review', array['Computer Systems and Their Components']),
    (1, 2, 'Internet and the Web', array['Understanding the Internet','The World Wide Web']),
    (1, 3, 'Browsers, URLs, and Web Communication', array['Web Browsers and URLs','HTTP and HTTPS']),
    (2, 1, 'Introduction to HTML', array['What Is HTML?','HTML Document Structure']),
    (2, 2, 'Text and Content', array['Headings and Paragraphs','Links and Navigation']),
    (2, 3, 'Images and Lists', array['Images in HTML','HTML Lists']),
    (2, 4, 'Structured HTML', array['HTML Tables','HTML Forms']),
    (2, 5, 'Semantic HTML', array['Semantic HTML Elements']),
    (3, 1, 'Introduction to CSS', array['What Is CSS?']),
    (3, 2, 'Selectors and Text Styling', array['CSS Selectors','Fonts and Text Formatting']),
    (3, 3, 'Colors and Backgrounds', array['CSS Colors and Backgrounds']),
    (3, 4, 'CSS Box Model', array['Borders, Margin, and Padding','Width, Height, and Basic Sizing']),
    (3, 5, 'Basic Layout', array['Basic CSS Layout with Flexbox','Styling a Complete Webpage']),
    (4, 1, 'Project Planning', array['Planning a Website']),
    (4, 2, 'Building the Website', array['Creating the HTML Structure','Styling the Website with CSS']),
    (4, 3, 'Testing and Presentation', array['Website Testing and Debugging','Final Website Presentation']);

  for class_record in
    select id, owner_id
    from public.classes
    where lower(name) = 'ns1'
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
          'Practical NS1 web development topic: ' || topic_record.topic_title || '.',
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
            'Students learn and apply ' || lower(lesson_title) || ' as part of a practical introduction to web development.',
            'Understand the key concepts; explain their purpose; create the related web content; and apply the skill independently in a small webpage.',
            'The lesson introduces ' || lower(lesson_title) || ' and explains how it contributes to structured, readable, safe, and accessible web pages.',
            'Students work directly with a browser and code editor to complete a guided HTML or CSS activity related to ' || lower(lesson_title) || '.',
            'IN-CLASS PRACTICAL ASSIGNMENT - approximately 30 minutes: complete the assigned ' || lower(lesson_title) || ' task and save the working files in the project folder.',
            'Keep the activity beginner-friendly, practical, and focused on HTML/CSS foundations without JavaScript or backend development.',
            120, 30, 30, 30, 30, 'planned', lesson_position, true
          );
        end loop;
      end loop;
    end loop;
  end loop;
end $$;