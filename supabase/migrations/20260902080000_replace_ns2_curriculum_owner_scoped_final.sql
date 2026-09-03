do $$
declare
  target_owner constant uuid := '3344ba75-4568-4d37-b7fc-e338324edc45';
  class_record record;
  unit_record record;
  topic_record record;
  lesson_record record;
  v_unit_id uuid;
  v_topic_id uuid;
  lesson_position int;
  unit_titles text[] := array[
    'Advanced HTML and CSS',
    'JavaScript Fundamentals',
    'JavaScript, DOM, Events, and Forms',
    'Interactive Website Project'
  ];
  unit_descriptions text[] := array[
    'Students strengthen semantic HTML, CSS structure, responsive layouts, and modern styling foundations for building polished websites.',
    'Students learn JavaScript fundamentals through browser-based projects that add interactivity, logic, and dynamic behavior to web pages.',
    'Students use JavaScript to manipulate the DOM, respond to events, validate forms, and build interactive web components.',
    'Students plan, build, test, and present a complete interactive multi-page website using HTML, CSS, and JavaScript.'
  ];
begin
  create temporary table topic_catalog (
    unit_order int,
    topic_order int,
    topic_title text
  ) on commit drop;

  create temporary table lesson_catalog (
    unit_order int,
    topic_order int,
    lesson_order int,
    lesson_title text,
    description text,
    objectives text,
    theory text,
    practical text,
    assignment_section text,
    notes text
  ) on commit drop;

  insert into topic_catalog (unit_order, topic_order, topic_title) values
    (1, 1, 'HTML Review and Advanced Structure'),
    (1, 2, 'Advanced CSS'),
    (1, 3, 'CSS Layout'),
    (2, 1, 'Introduction to JavaScript'),
    (2, 2, 'Conditions'),
    (2, 3, 'Loops'),
    (3, 1, 'Functions'),
    (3, 2, 'DOM Manipulation'),
    (3, 3, 'Events'),
    (3, 4, 'Interactive Components'),
    (4, 1, 'Project Planning'),
    (4, 2, 'Project Development'),
    (4, 3, 'Testing and Debugging'),
    (4, 4, 'Final Presentation');

  insert into lesson_catalog (unit_order, topic_order, lesson_order, lesson_title, description, objectives, theory, practical, assignment_section, notes) values
    (1, 1, 1, 'HTML Review and Semantic Structure',
     'Review HTML fundamentals and strengthen students'' ability to create well-structured semantic webpages.',
     'Review HTML document structure. Use semantic HTML elements correctly. Organize page content logically. Improve accessibility and readability through semantic structure.',
     'Review html, head, body, headings, paragraphs, links, images, lists, tables, forms, header, nav, main, section, article, and footer.',
     'Students take an existing basic webpage and restructure it using appropriate semantic elements.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a semantic webpage structure for a school website containing header, navigation, main content, sections, and footer.',
     'Focus on meaningful structure rather than visual appearance.'),
    (1, 1, 2, 'Advanced HTML Forms',
     'Review forms and introduce additional form controls and attributes.',
     'Create different input types. Use labels correctly. Use required fields. Understand basic form validation attributes. Organize forms clearly.',
     'Explain input types, label, placeholder, required, textarea, select, option, checkbox, radio button, and button.',
     'Students create a complete registration form.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a student registration form containing text inputs, email, date, select, radio buttons, checkboxes, textarea, and a submit button.',
     'Client-side validation will later be enhanced with JavaScript.'),
    (1, 2, 3, 'CSS Cascade and Specificity',
     'Introduce the basic rules the browser uses when multiple CSS rules apply to the same element.',
     'Understand the CSS cascade. Understand basic specificity. Resolve conflicting styles. Organize CSS rules correctly.',
     'Explain cascade, inheritance, specificity, source order, element selectors, class selectors, and ID selectors.',
     'Students debug a webpage containing conflicting CSS rules.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Fix a provided webpage where several CSS rules conflict and explain which rules take priority.',
     'Do not go deeply into advanced selector specificity calculations.'),
    (1, 2, 4, 'CSS Positioning',
     'Introduce basic CSS positioning for webpage elements.',
     'Understand normal document flow. Use relative positioning. Use absolute positioning. Understand fixed positioning at a basic level.',
     'Explain position: static, relative, absolute, fixed, and basic positioning behavior.',
     'Students create a webpage containing positioned elements such as badges, labels, and simple overlays.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a card component containing a positioned label or badge.',
     'Avoid advanced layout tricks.'),
    (1, 2, 5, 'Responsive Web Design',
     'Introduce the principles of making websites usable on different screen sizes.',
     'Understand responsive design. Understand viewport size. Use percentages and flexible dimensions. Create a basic media query. Test a webpage at different screen sizes.',
     'Explain responsive design, viewport, flexible layouts, media queries, mobile-first thinking, and screen sizes.',
     'Students modify an existing webpage so that it adapts to smaller screens.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a webpage that changes its layout when the screen becomes smaller.',
     'Only introduce basic media queries.'),
    (1, 3, 6, 'Advanced Flexbox',
     'Develop stronger skills using Flexbox for webpage layouts.',
     'Create flexible layouts. Use flex-direction. Use justify-content. Use align-items. Use flex-wrap. Use gap.',
     'Explain Flexbox containers, items, direction, alignment, wrapping, spacing, and flexible sizing.',
     'Students create a navigation bar and responsive card layout.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a responsive row of cards that wraps appropriately on smaller screens.',
     'Flexbox should become a primary layout tool for students.'),
    (1, 3, 7, 'CSS Grid Introduction',
     'Introduce CSS Grid as another method for creating structured layouts.',
     'Understand the purpose of CSS Grid. Create rows and columns. Use grid-template-columns. Use gap. Create simple grid layouts.',
     'Explain grid containers, rows, columns, grid-template-columns, gap, and basic placement.',
     'Students create a gallery or dashboard using CSS Grid.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a responsive image gallery using CSS Grid.',
     'Keep Grid fundamentals simple.'),
    (2, 1, 8, 'What Is JavaScript?',
     'Introduce JavaScript and explain how it adds behavior and interactivity to webpages.',
     'Define JavaScript. Explain the relationship between HTML, CSS, and JavaScript. Add JavaScript to an HTML page. Run simple JavaScript code in the browser.',
     'Explain HTML as structure, CSS as presentation, JavaScript as behavior, script elements, external JavaScript files, and browser execution.',
     'Students create a webpage and connect an external JavaScript file.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a webpage that displays a message using JavaScript.',
     'Emphasize the three-layer model: HTML, CSS, JavaScript.'),
    (2, 1, 9, 'Variables and Data Types',
     'Introduce variables and basic JavaScript data types.',
     'Create variables using let and const. Store values. Understand strings. Understand numbers. Understand booleans. Use typeof at a basic level.',
     'Explain variables, let, const, strings, numbers, booleans, undefined, and basic data types.',
     'Students create a JavaScript program that stores information such as name, age, class, and student status.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a small JavaScript profile program using at least five variables of different types.',
     'Do not introduce var unless needed to explain older code.'),
    (2, 1, 10, 'Operators and Expressions',
     'Teach students to perform calculations and comparisons in JavaScript.',
     'Use arithmetic operators. Use comparison operators. Understand expressions. Store calculation results.',
     'Explain +, -, *, /, %, comparison operators, assignment, and basic logical operators.',
     'Students create a simple calculator using JavaScript.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a program that calculates the total and average of several numbers.',
     'Use simple mathematical examples.'),
    (2, 2, 11, 'if and else Statements',
     'Teach students how programs make decisions using conditions.',
     'Understand conditional logic. Use if statements. Use else. Compare values. Create simple decision-making programs.',
     'Explain conditions, boolean expressions, if, else, comparison operators, and decision-making.',
     'Students create programs that determine whether a student passed or failed based on a fictional grade.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a grade evaluator that displays different messages depending on the student''s score.',
     'Use fictional data only.'),
    (2, 2, 12, 'else if and Multiple Conditions',
     'Teach students how to handle multiple possible conditions.',
     'Use else if. Handle multiple conditions. Build simple grading logic. Understand condition order.',
     'Explain else if, multiple conditions, logical operators, and condition order.',
     'Students create a grading system that assigns categories based on scores.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a program that classifies a score into several categories.',
     'Focus on readable conditional logic.'),
    (2, 3, 13, 'for Loops',
     'Introduce loops for repeating instructions.',
     'Understand repetition. Create a for loop. Use counters. Control the number of repetitions.',
     'Explain loops, counters, initialization, condition, increment, and for loop syntax.',
     'Students create programs that display sequences of numbers.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a program that displays numbers from 1 to 20 and calculates their total.',
     'Keep loop examples simple.'),
    (2, 3, 14, 'while Loops',
     'Introduce while loops and compare them with for loops.',
     'Create while loops. Understand loop conditions. Avoid infinite loops. Choose an appropriate loop type.',
     'Explain while, loop conditions, counters, and infinite loops.',
     'Students create simple repetition programs.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a program that repeatedly performs an action until a specified condition becomes false.',
     'Demonstrate how an incorrect condition can create an infinite loop.'),
    (3, 1, 15, 'Introduction to Functions',
     'Teach students to organize reusable JavaScript instructions into functions.',
     'Understand functions. Create functions. Call functions. Use parameters. Return values at a basic level.',
     'Explain function declarations, parameters, arguments, return values, and code reuse.',
     'Students create simple reusable calculation functions.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create at least three functions for calculations such as addition, average, and percentage.',
     'Focus on understanding reusable code.'),
    (3, 1, 16, 'Arrays',
     'Introduce arrays for storing multiple related values.',
     'Create arrays. Access array elements. Understand indexes. Add and remove basic values. Loop through arrays.',
     'Explain arrays, indexes, zero-based indexing, length, push, and basic iteration.',
     'Students create an array containing fictional student names and display them.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create an array of at least five items and use a loop to display each item.',
     'Use simple arrays before introducing advanced methods.'),
    (3, 2, 17, 'Understanding the DOM',
     'Introduce the Document Object Model and how JavaScript interacts with HTML.',
     'Understand the DOM. Select HTML elements. Change text content. Change basic element properties.',
     'Explain DOM, document, elements, nodes, querySelector, getElementById, and textContent.',
     'Students create a webpage whose content changes when JavaScript executes.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a webpage where JavaScript changes at least three HTML elements dynamically.',
     'This is a major transition from JavaScript console exercises to browser programming.'),
    (3, 2, 18, 'Changing Styles with JavaScript',
     'Teach students how JavaScript can dynamically affect webpage appearance.',
     'Select elements. Modify classes. Modify basic styles. Create visual changes based on user actions.',
     'Explain classList, class manipulation, style property, and the separation between CSS and JavaScript.',
     'Students create a webpage where JavaScript changes the appearance of selected elements.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a button that changes a webpage element''s appearance when clicked.',
     'Prefer adding/removing CSS classes rather than writing large amounts of inline style.'),
    (3, 3, 19, 'JavaScript Events',
     'Teach students how websites respond to user actions.',
     'Understand events. Use click events. Use event listeners. Connect user actions to JavaScript functions.',
     'Explain events, event listeners, click, input, submit, and basic event handling.',
     'Students create interactive buttons and controls.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a webpage containing at least three interactive elements responding to user actions.',
     'Keep event handling simple and practical.'),
    (3, 3, 20, 'Forms and JavaScript Validation',
     'Teach students to use JavaScript to validate form input.',
     'Detect form submission. Read input values. Validate required fields. Display validation messages. Prevent invalid submission.',
     'Explain form events, preventDefault, input values, validation, conditions, and user feedback.',
     'Students create a registration form with JavaScript validation.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a form that checks whether required fields are completed and displays appropriate messages.',
     'This is client-side validation only. No backend processing.'),
    (3, 4, 21, 'Building an Interactive Counter',
     'Students use variables, functions, DOM manipulation, and events to build a simple interactive component.',
     'Combine JavaScript concepts. Update DOM content. Respond to button clicks. Manage application state using a variable.',
     'Review variables, functions, DOM selection, textContent, and click events.',
     'Students build a counter with increment, decrement, and reset buttons.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a functional counter with three buttons: +1, -1, and Reset.',
     'Use this as a small integration exercise.'),
    (3, 4, 22, 'Interactive To-Do List',
     'Introduce a small real-world JavaScript application.',
     'Work with arrays. Create DOM elements. Handle user input. Respond to events. Add and remove items.',
     'Review arrays, functions, DOM manipulation, events, and form/input handling.',
     'Students build a simple to-do list that allows users to add and remove tasks.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a functional to-do list where users can add tasks and remove completed tasks.',
     'Keep the project simple and focus on core JavaScript concepts.'),
    (4, 1, 23, 'Planning an Interactive Website',
     'Teach students to plan an interactive website before development.',
     'Define the purpose of a website. Identify target users. Plan pages and navigation. Identify interactive features. Organize project files.',
     'Explain project planning, sitemap, user interaction, page structure, assets, and file organization.',
     'Students design the structure of their final project.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a sitemap and feature list for a multi-page interactive website.',
     'Teacher approves the project before implementation.'),
    (4, 2, 24, 'Building the HTML and CSS Foundation',
     'Students create the structural and visual foundation of their final project.',
     'Build multiple HTML pages. Use semantic HTML. Create consistent CSS. Create responsive layouts. Organize project files.',
     'Review semantic HTML, CSS selectors, Flexbox, Grid, responsive design, and file organization.',
     'Students build the HTML/CSS structure of their final website.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Complete the structure and visual design for the main pages of the project.',
     'JavaScript interaction will be added in the next lesson.'),
    (4, 2, 25, 'Adding JavaScript Interactivity',
     'Students add JavaScript functionality to their website.',
     'Connect JavaScript to HTML. Use DOM manipulation. Use events. Use functions. Create interactive components.',
     'Review JavaScript variables, conditions, loops, functions, arrays, DOM, and events.',
     'Students add at least two meaningful interactive features to their website.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Implement at least two JavaScript features such as: interactive menu, form validation, counter, dynamic content, image interaction, simple calculator, or to-do list.',
     'Features should have a meaningful purpose within the website.'),
    (4, 3, 26, 'Testing and Debugging JavaScript',
     'Teach students to identify and correct common HTML, CSS, and JavaScript errors.',
     'Identify syntax errors. Identify incorrect selectors. Identify broken links. Debug basic JavaScript problems. Test interactive features.',
     'Explain debugging, browser console, syntax errors, logic errors, missing elements, incorrect file paths, and testing.',
     'Students debug a deliberately broken website and then test their own project.',
     'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Complete a debugging checklist and fix at least three problems in the project.',
     'Introduce browser developer tools only at a basic level.'),
    (4, 4, 27, 'Final Interactive Website Project',
     'Students present a complete interactive website demonstrating their NS2 skills.',
     'Demonstrate HTML knowledge. Demonstrate CSS knowledge. Demonstrate JavaScript fundamentals. Demonstrate DOM manipulation. Demonstrate event handling. Explain their project.',
     'Review the major concepts covered throughout NS2.',
     'Students demonstrate their website to the class.',
     'IN-CLASS FINAL PROJECT SUBMISSION: Students submit HTML files, CSS files, JavaScript files, images/assets, a multi-page website, at least two meaningful interactive features, and a responsive layout.',
     'Evaluate structure, design, functionality, code organization, and student ability to explain their work.');

  for class_record in
    select id, owner_id
    from public.classes
    where lower(name) = 'ns2'
      and owner_id = target_owner
  loop
    delete from public.lessons where class_id = class_record.id;
    delete from public.topics where unit_id in (select id from public.units where class_id = class_record.id);
    delete from public.units where class_id = class_record.id;

    for unit_record in
      select n, unit_titles[n] as title, unit_descriptions[n] as description
      from generate_series(1, 4) as n
    loop
      insert into public.units (owner_id, class_id, title, description, position, is_active)
      values (
        class_record.owner_id,
        class_record.id,
        'Unit ' || unit_record.n || ' — ' || unit_record.title,
        unit_record.description,
        unit_record.n,
        true
      )
      returning id into v_unit_id;

      for topic_record in
        select *
        from topic_catalog
        where unit_order = unit_record.n
        order by topic_order
      loop
        insert into public.topics (owner_id, unit_id, title, description, position, is_active)
        values (
          class_record.owner_id,
          v_unit_id,
          'Topic ' || topic_record.topic_order || ' — ' || topic_record.topic_title,
          'NS2 topic: ' || topic_record.topic_title || '.',
          topic_record.topic_order,
          true
        )
        returning id into v_topic_id;

        lesson_position := 0;
        for lesson_record in
          select lesson_title, description, objectives, theory, practical, assignment_section, notes
          from lesson_catalog
          where unit_order = unit_record.n
            and topic_order = topic_record.topic_order
          order by lesson_order
        loop
          lesson_position := lesson_position + 1;
          insert into public.lessons (
            owner_id,
            class_id,
            unit_id,
            topic_id,
            title,
            description,
            objectives,
            theory,
            practical,
            assignment_section,
            notes,
            estimated_minutes,
            theory_minutes,
            demo_minutes,
            assignment_minutes,
            review_minutes,
            status,
            position,
            is_active
          ) values (
            class_record.owner_id,
            class_record.id,
            v_unit_id,
            v_topic_id,
            lesson_record.lesson_title,
            lesson_record.description,
            lesson_record.objectives,
            lesson_record.theory,
            lesson_record.practical,
            lesson_record.assignment_section,
            lesson_record.notes,
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
