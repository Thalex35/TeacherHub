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
    'Programming and Server-Side Web Foundations',
    'PHP Programming',
    'PHP Forms and MySQL Databases',
    'CRUD, Authentication, Security, and Final Project'
  ];
  unit_descriptions text[] := array[
    'Students review core programming concepts and transition into server-side web development with PHP and the request-response model.',
    'Students develop practical PHP programming skills using conditions, loops, arrays, and functions for logic and dynamic content.',
    'Students learn to process HTML forms, interact with MySQL databases, and connect PHP to database-backed web applications.',
    'Students complete CRUD operations, add basic authentication and security, and build a final PHP + MySQL project.'
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
    (1, 1, 'Programming Review'),
    (1, 2, 'PHP Introduction'),
    (2, 1, 'Conditions'),
    (2, 2, 'Loops'),
    (2, 3, 'Arrays'),
    (2, 4, 'PHP Functions'),
    (3, 1, 'HTML Forms + PHP'),
    (3, 2, 'MySQL and SQL'),
    (3, 3, 'PHP + MySQL'),
    (4, 1, 'CRUD Applications'),
    (4, 2, 'Authentication'),
    (4, 3, 'Security'),
    (4, 4, 'Final PHP + MySQL Project');

  insert into lesson_catalog (unit_order, topic_order, lesson_order, lesson_title, description, objectives, theory, practical, assignment_section, notes) values
    (1, 1, 1, 'Programming Concepts Review', 'Review fundamental programming concepts from JavaScript before introducing PHP.', 'Review variables. Review data types. Review conditions. Review loops. Review functions. Understand the purpose of server-side programming.', 'Review variables, data types, operators, conditions, loops, functions, arrays, and program logic. Introduce the difference between client-side and server-side programming.', 'Students solve simple programming problems using concepts they already learned.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Write simple programs that use variables, conditions, loops, and functions to solve three small problems.', 'Use JavaScript for the review before transitioning to PHP.'),
    (1, 1, 2, 'Client-Side vs Server-Side Programming', 'Explain the difference between code executed in the browser and code executed on a server.', 'Define client-side programming. Define server-side programming. Explain the role of a web server. Understand why backend programming is necessary. Understand the request-response cycle at a basic level.', 'Explain browser, server, client, request, response, HTML generation, client-side JavaScript, and server-side PHP.', 'Students analyze a simple webpage and identify which operations happen in the browser and which require a server.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a simple diagram showing browser → server → database → server → browser.', 'Keep networking concepts conceptual.'),
    (1, 2, 3, 'Introduction to PHP', 'Introduce PHP as a server-side programming language for web development.', 'Define PHP. Explain why PHP is used. Create a PHP file. Execute a basic PHP program through a local server. Display output using PHP.', 'Explain PHP, server-side execution, PHP files, PHP tags, echo, and the basic request-response process.', 'Students create a basic PHP webpage and display dynamic text.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a PHP page that displays a student''s fictional name, class, and a personalized message.', 'Students must understand that PHP requires a server environment to execute.'),
    (1, 2, 4, 'PHP Variables and Data Types', 'Teach students how to store and manipulate data in PHP.', 'Create PHP variables. Understand strings. Understand integers and floating-point numbers. Understand booleans. Display variable values.', 'Explain PHP variables, $, strings, integers, floats, booleans, constants at a basic level, and variable naming.', 'Students create a PHP profile page using variables.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a PHP page containing at least five variables representing fictional student information.', 'Use let/const comparison with JavaScript where useful.'),
    (1, 2, 5, 'PHP Operators and Expressions', 'Teach students to perform calculations and comparisons using PHP.', 'Use arithmetic operators. Use comparison operators. Create expressions. Calculate values using variables.', 'Explain arithmetic, comparison, assignment, and logical operators in PHP.', 'Students create a simple PHP calculator.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a PHP program that calculates total, average, and percentage values.', 'Connect calculations to real-world examples.'),
    (2, 1, 6, 'PHP if and else', 'Teach students to implement decision-making logic in PHP.', 'Use if. Use else. Compare values. Build simple decision-making programs.', 'Explain conditional expressions, if, else, comparison operators, and boolean logic.', 'Students create a PHP program that evaluates fictional student grades.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a PHP grade evaluator that displays different results based on a student''s score.', 'Use fictional student information.'),
    (2, 1, 7, 'Multiple Conditions', 'Teach students to handle multiple possible outcomes using PHP.', 'Use elseif. Combine conditions. Use logical operators. Build multi-level decision systems.', 'Explain elseif, &&, ||, !, and condition order.', 'Students create a PHP program that categorizes students according to fictional grades.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a PHP grading system with at least four possible outcomes.', 'Focus on readable logic.'),
    (2, 2, 8, 'PHP Loops', 'Teach students how to repeat operations in PHP.', 'Use for loops. Use while loops. Understand counters. Avoid infinite loops.', 'Explain for, while, loop conditions, counters, and repetition.', 'Students create PHP programs that generate number sequences and repeated HTML content.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a PHP program that generates a list of numbers and calculates their total.', 'Connect loops to generating dynamic webpage content.'),
    (2, 3, 9, 'PHP Arrays', 'Introduce arrays for storing multiple related values.', 'Create indexed arrays. Access array elements. Use count(). Loop through arrays. Generate HTML from array data.', 'Explain arrays, indexes, count(), foreach, and array iteration.', 'Students create an array of fictional students and dynamically display the list in HTML.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create an array containing at least eight fictional students and display them dynamically using foreach.', 'This prepares students for database result processing.'),
    (2, 4, 10, 'PHP Functions', 'Teach students to organize reusable logic into PHP functions.', 'Create functions. Use parameters. Return values. Reuse code. Organize PHP programs.', 'Explain function declaration, parameters, arguments, return values, scope at a basic level, and reusable code.', 'Students create reusable PHP functions for calculations.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create at least three PHP functions and use them in a small PHP application.', 'Encourage meaningful function names.'),
    (3, 1, 11, 'Processing Forms with PHP', 'Teach students how PHP receives information submitted through HTML forms.', 'Create an HTML form. Understand GET and POST. Receive form values in PHP. Display submitted information. Understand basic form processing.', 'Explain forms, form actions, methods, GET, POST, input names, $_GET, $_POST, and request data.', 'Students create a form and process its data using PHP.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a student-information form and a PHP page that receives and displays the submitted information.', 'Use fictional data.'),
    (3, 1, 12, 'Server-Side Form Validation', 'Teach students to validate user input on the server.', 'Validate required fields. Check basic input formats. Display validation errors. Prevent invalid data from being processed.', 'Explain server-side validation, required fields, empty values, input validation, error messages, and why client-side validation alone is insufficient.', 'Students add PHP validation to a registration form.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a form that validates at least three fields and displays appropriate error messages.', 'Do not store the submitted data yet.'),
    (3, 2, 13, 'Introduction to Databases', 'Introduce relational databases and explain why web applications use them.', 'Define a database. Explain tables, rows, and columns. Understand primary keys. Understand why databases are useful for web applications.', 'Explain databases, relational databases, tables, records, fields, primary keys, and relationships at a basic level.', 'Students inspect a simple database containing fictional student records.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Design a simple students table by identifying appropriate columns and data types.', 'Keep database design introductory.'),
    (3, 2, 14, 'SQL SELECT', 'Teach students to retrieve data from a MySQL database.', 'Understand SQL. Write SELECT queries. Select specific columns. Use WHERE. Sort results using ORDER BY.', 'Explain SQL, SELECT, FROM, WHERE, ORDER BY, and basic filtering.', 'Students execute SELECT queries against a classroom database.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Write several SQL queries to retrieve fictional student records based on different conditions.', 'Use safe, read-only queries initially.'),
    (3, 2, 15, 'SQL INSERT, UPDATE, and DELETE', 'Teach students the basic SQL operations used to modify database data.', 'Insert records. Update records. Delete records. Understand the effect of each operation. Use WHERE carefully.', 'Explain INSERT, UPDATE, DELETE, WHERE, and CRUD.', 'Students modify a controlled practice database.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Perform an INSERT, UPDATE, and DELETE operation on fictional classroom data.', 'Emphasize WHERE with UPDATE and DELETE to avoid modifying unintended records.'),
    (3, 3, 16, 'Connecting PHP to MySQL', 'Teach students how a PHP application communicates with a MySQL database.', 'Understand database connections. Connect PHP to MySQL. Execute basic SQL queries from PHP. Handle basic connection errors.', 'Explain PHP database connectivity, connection credentials, SQL execution, results, and basic error handling.', 'Students connect a PHP application to a local MySQL database.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a PHP page that successfully connects to a MySQL database and retrieves a small dataset.', 'Never place real passwords or credentials in public code.'),
    (3, 3, 17, 'Displaying Database Data', 'Teach students to retrieve database records and display them dynamically in HTML.', 'Execute SELECT queries from PHP. Process query results. Use loops to display records. Generate HTML dynamically.', 'Explain query results, result iteration, foreach/while patterns, and dynamic HTML generation.', 'Students create a PHP page displaying fictional student records in an HTML table.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a PHP page that retrieves at least five database records and displays them in a formatted HTML table.', 'This is the first complete database-backed webpage.'),
    (4, 1, 18, 'Create — Adding Database Records', 'Teach students to create new database records through a PHP form.', 'Create an HTML form. Validate input. Use INSERT through PHP. Save submitted information in a database. Display confirmation messages.', 'Explain the Create operation in CRUD, forms, validation, INSERT, and successful submission feedback.', 'Students create a PHP form for adding fictional student records.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a working form that inserts a new fictional student into a MySQL database.', 'Use prepared statements or parameterized queries where supported.'),
    (4, 1, 19, 'Read — Listing Database Records', 'Build the Read part of a CRUD application.', 'Retrieve records. Display records in HTML. Format database results. Add basic filtering.', 'Review SELECT and explain the Read operation in CRUD.', 'Students create a student-list page connected to MySQL.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a page that displays database records in a table and allows basic filtering.', 'Keep filtering simple.'),
    (4, 1, 20, 'Update — Editing Records', 'Teach students to modify existing database records through PHP.', 'Identify a record using its ID. Load existing data into a form. Modify the record. Use UPDATE safely.', 'Explain record IDs, editing forms, UPDATE, WHERE, and validation.', 'Students build an edit page for fictional student records.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create an edit form that loads an existing record and updates it in the database.', 'Emphasize identifying the correct record before updating.'),
    (4, 1, 21, 'Delete — Removing Records', 'Teach students to safely delete database records.', 'Identify records by ID. Use DELETE. Confirm destructive actions. Validate the requested record.', 'Explain DELETE, WHERE, confirmation, and safe deletion.', 'Students implement a delete operation in a controlled practice application.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Add a delete function to the student management application with a confirmation step.', 'Use fictional data and a practice database.'),
    (4, 2, 22, 'Introduction to User Authentication', 'Introduce the concept of authentication in web applications.', 'Define authentication. Understand login and logout. Understand sessions. Explain why authentication is necessary.', 'Explain users, authentication, credentials, sessions, login, logout, and protected pages.', 'Students analyze a simple authentication workflow.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a basic PHP session-based login demonstration using fictional accounts.', 'Keep authentication simple and educational.'),
    (4, 3, 23, 'Password Security', 'Teach students how passwords should be handled securely.', 'Understand why passwords should never be stored as plain text. Understand password hashing. Use password_hash(). Use password_verify(). Understand basic credential security.', 'Explain plaintext passwords, hashing, password_hash(), password_verify(), and secure password handling.', 'Students implement password hashing in a controlled PHP login example.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Modify a login example so that passwords are stored using password hashing and verified securely.', 'Never use real student passwords.'),
    (4, 3, 24, 'SQL Injection and Secure Database Queries', 'Introduce SQL injection and basic techniques for preventing it.', 'Understand SQL injection conceptually. Explain why directly concatenating user input into SQL is dangerous. Understand prepared statements. Use parameterized queries.', 'Explain SQL injection, untrusted input, prepared statements, parameterized queries, and safe database interaction.', 'Students compare an unsafe query pattern with a parameterized query.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Convert a provided unsafe database query into a safer parameterized query.', 'Do not conduct attacks against real websites or systems.'),
    (4, 4, 25, 'Planning the Database Application', 'Students plan their final database-backed web application.', 'Define an application purpose. Identify users and data. Design a basic database table. Plan CRUD operations. Plan application pages.', 'Review PHP, forms, MySQL, CRUD, authentication, and basic security.', 'Students create a project plan and database design.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a project sitemap and database design containing tables, fields, and primary keys.', 'Teacher approves the project before development begins.'),
    (4, 4, 26, 'Building the PHP + MySQL Application', 'Students develop their database-backed application.', 'Connect PHP to MySQL. Process forms. Insert records. Retrieve records. Update records. Delete records.', 'Review CRUD architecture and database interaction.', 'Students implement the core functionality of their project.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Complete at least one Create, Read, Update, and Delete operation in the project.', 'Teacher checks database connectivity and CRUD functionality.'),
    (4, 4, 27, 'Testing, Debugging, and Security Review', 'Teach students to test their database application and correct common problems.', 'Test forms. Test CRUD operations. Identify PHP errors. Identify database errors. Review input validation. Review basic security practices.', 'Explain testing, debugging, error handling, validation, prepared statements, password security, and safe data handling.', 'Students test their applications using fictional data.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Complete a testing checklist and fix at least three problems found in the application.', 'Students should test both valid and invalid input.'),
    (4, 4, 28, 'Final Database Web Application Presentation', 'Students present a complete PHP + MySQL web application.', 'Demonstrate PHP programming. Demonstrate database interaction. Demonstrate CRUD. Demonstrate form processing. Demonstrate basic authentication/security. Explain the application architecture.', 'Review the complete development process from HTML forms to PHP and MySQL.', 'Students demonstrate their applications to the class.', 'IN-CLASS FINAL PROJECT SUBMISSION: Students submit: HTML/PHP files; CSS files; Database SQL/schema; PHP database connection; CRUD functionality; Forms; Basic authentication where applicable; Documentation explaining the application.', 'Evaluate functionality, organization, code quality, database design, security practices, and student''s ability to explain the project.');

  for class_record in
    select id, owner_id
    from public.classes
    where lower(name) = 'ns3'
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
          'NS3 topic: ' || topic_record.topic_title || '.',
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
