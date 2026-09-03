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
    'Advanced JavaScript and Front-End Development',
    'Advanced PHP, Database Design, and Application Architecture',
    'APIs, JSON, and Full-Stack Integration',
    'Security, Authentication, and Real-World Web Development',
    'Git, GitHub, Deployment, and Professional Development',
    'Full-Stack Capstone Project'
  ];
  unit_descriptions text[] := array[
    'Students strengthen JavaScript fundamentals and build dynamic front-end logic before connecting their applications to backend services and APIs.',
    'Students move beyond basic CRUD and learn how to organize PHP applications, design robust database structures, and write advanced SQL queries.',
    'Students learn how frontend and backend systems communicate through HTTP, JSON, and API endpoints.',
    'Students use sessions, security patterns, validation, hashing, and responsible development practices to build safer web applications.',
    'Students learn professional web-development practices including version control, GitHub workflow, deployment preparation, and live deployment basics.',
    'Students combine their previous knowledge to design, build, secure, test, and present a complete full-stack web application.'
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
    (1, 1, 'Modern JavaScript Review and ES6+'),
    (1, 2, 'Objects and Advanced Data Handling'),
    (1, 3, 'JavaScript Array Methods and Application Logic'),
    (1, 4, 'Asynchronous JavaScript and Fetch API'),
    (2, 1, 'PHP Application Structure'),
    (2, 2, 'Introduction to PHP Object-Oriented Programming'),
    (2, 3, 'Advanced Database Design'),
    (2, 4, 'Advanced SQL'),
    (3, 1, 'Web APIs'),
    (3, 2, 'JSON Data'),
    (3, 3, 'PHP REST-Style APIs'),
    (3, 4, 'Frontend and Backend Integration'),
    (4, 1, 'Authentication and Authorization'),
    (4, 2, 'Secure Database Programming'),
    (4, 3, 'Secure Forms and User Input'),
    (4, 4, 'Application Security and Responsible Development'),
    (5, 1, 'Version Control'),
    (5, 2, 'Deployment'),
    (6, 1, 'Project Planning'),
    (6, 2, 'Frontend Development'),
    (6, 3, 'Backend Development'),
    (6, 4, 'Authentication and Security'),
    (6, 5, 'Testing, Debugging, and Finalization');

  insert into lesson_catalog (unit_order, topic_order, lesson_order, lesson_title, description, objectives, theory, practical, assignment_section, notes) values
    (1, 1, 1, 'Modern JavaScript Syntax', 'Teach modern JavaScript syntax that makes code shorter, clearer, and easier to maintain.', 'Use let and const. Use template literals. Use arrow functions. Use destructuring. Use default parameters. Use spread and rest operators.', 'Explain let, const, template strings, arrow functions, destructuring, default parameters, and spread/rest operators.', 'Students refactor older JavaScript code using modern syntax.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a small JavaScript program using let/const, template literals, arrow functions, and at least one modern ES6 feature.', 'Focus on code readability and modern JavaScript practice.'),
    (1, 2, 2, 'Objects and Advanced Data Handling', 'Teach students how to use JavaScript objects to represent real-world data.', 'Create JavaScript objects. Access and update properties. Work with nested objects. Use arrays of objects. Represent structured data clearly.', 'Explain JavaScript objects, property access, nested objects, arrays of objects, and object-oriented data representation.', 'Create an array of student objects and display selected information dynamically.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create and display a small collection of objects representing students, products, or books.', 'Use meaningful object names and realistic data.'),
    (1, 3, 3, 'Array Methods', 'Teach students how to process data in arrays using modern JavaScript methods.', 'Use forEach(), map(), filter(), find(), reduce(), and sort(). Process data collections efficiently.', 'Explain array methods, callback functions, iteration, data transformation, and collection processing.', 'Process an array of students or products using different array methods.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a JavaScript data-processing exercise using at least three array methods.', 'Compare methods with simple examples before moving to larger data.'),
    (1, 3, 4, 'Building Reusable Front-End Logic', 'Teach students how to structure JavaScript logic so code is easier to maintain and reuse.', 'Separate logic from presentation. Build reusable functions. Organize JavaScript code. Understand the idea of modular logic.', 'Explain reusable functions, maintainable front-end code, logic organization, and basic module concepts.', 'Separate application logic into reusable functions.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Refactor a small JavaScript application into multiple reusable functions.', 'Encourage clear names and small functions.'),
    (1, 4, 5, 'Asynchronous Programming', 'Introduce the concept of asynchronous JavaScript so students understand how code can run after delay or network activity.', 'Understand synchronous vs asynchronous execution. Understand callbacks. Understand Promises. Use async/await.', 'Explain synchronous code, asynchronous behavior, callbacks, Promises, async functions, and await.', 'Create a simulated asynchronous operation.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a small JavaScript program using Promise and async/await.', 'Keep the examples simple and focused on understanding the idea.'),
    (1, 4, 6, 'Fetch API and HTTP Requests', 'Teach students how JavaScript communicates with remote services and APIs.', 'Use fetch(). Understand HTTP requests. Understand GET requests. Handle JSON responses. Handle errors.', 'Explain fetch(), HTTP methods, response handling, JSON parsing, and error handling.', 'Retrieve data from a public or test API and display it on a webpage.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Use fetch() to retrieve JSON data and dynamically display selected information on a webpage.', 'Use a safe test API or classroom-friendly example.'),
    (2, 1, 7, 'PHP Code Organization', 'Teach students to organize PHP code into maintainable files and reusable components.', 'Separate responsibilities. Use reusable PHP files. Use include and require. Use configuration files. Organize folders.', 'Explain include, require, application folders, configuration files, and separation of presentation and logic.', 'Organize a small PHP application into multiple files.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a small PHP application with reusable components and separated files.', 'This prepares students for larger application structure.'),
    (2, 2, 8, 'Introduction to PHP Object-Oriented Programming', 'Introduce classes and objects as a way to model real-world data in PHP.', 'Create classes. Create objects. Use properties. Use methods. Use constructors. Understand visibility.', 'Explain classes, objects, properties, methods, constructors, and basic visibility.', 'Create a simple PHP class.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a PHP class representing a real-world object such as Student, Product, or Book.', 'Keep the examples practical and easy to understand.'),
    (2, 3, 9, 'Relational Database Design', 'Teach students how to design a relational database for a small application.', 'Understand tables, records, fields, primary keys, foreign keys, and relationships. Understand one-to-one, one-to-many, and many-to-many concepts.', 'Explain relational databases, tables, records, keys, and relationships between data.', 'Design a relational database for a small application.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Design tables and relationships for a school, library, inventory, or similar application.', 'Focus on realistic data relationships.'),
    (2, 3, 10, 'Database Normalization', 'Teach students why duplicate data can cause problems in applications.', 'Understand duplicate data. Understand data integrity. Understand basic normalization. Understand first, second, and third normal form at a basic level.', 'Explain duplicate data, integrity, normalization, and common design mistakes.', 'Improve a poorly designed database.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Identify database design problems and reorganize the tables to reduce unnecessary duplication.', 'Keep the theory conceptual and practical.'),
    (2, 4, 11, 'SQL JOINs', 'Teach students to combine data from multiple tables in SQL.', 'Use INNER JOIN and LEFT JOIN. Retrieve related records. Understand how table relationships work in queries.', 'Explain JOINs, relationship keys, and how to connect related tables in one query.', 'Create queries combining multiple tables.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Write SQL queries using JOINs to retrieve related records from at least two tables.', 'Use simple data examples.'),
    (2, 4, 12, 'Advanced SQL Queries', 'Teach students to summarize and analyze database records using more advanced SQL features.', 'Use GROUP BY. Use COUNT, SUM, AVG, MIN, and MAX. Use HAVING. Use ORDER BY.', 'Explain aggregates, grouping, filtering grouped results, and sorting query output.', 'Create reports from database data.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create SQL queries that calculate statistics and summarize records.', 'Keep the examples classroom-friendly and realistic.'),
    (3, 1, 13, 'Introduction to APIs', 'Introduce the idea of an API as a way for software systems to talk to each other.', 'Define API. Understand client-server communication. Understand endpoints, requests, responses, and HTTP methods.', 'Explain API concepts, endpoints, requests, responses, and HTTP methods including GET, POST, PUT, and DELETE.', 'Analyze a simple API and identify its endpoints and HTTP methods.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Document the endpoints and expected requests/responses of a simple API.', 'Relate this to real-world web services and classroom examples.'),
    (3, 2, 14, 'JSON Data', 'Teach students how JSON is used to exchange structured data between systems.', 'Understand JSON structure. Understand objects and arrays. Understand JSON encoding and decoding.', 'Explain JSON, object syntax, arrays, encoding, decoding, and differences from HTML.', 'Create and manipulate JSON data.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a JSON dataset and use JavaScript to read and display the data.', 'Connect the concept to API responses.'),
    (3, 3, 15, 'Creating a PHP API', 'Teach students how to build a simple API in PHP that returns structured data.', 'Create a PHP API endpoint. Receive requests. Return JSON. Understand the basic structure of an API.', 'Explain PHP API endpoints, HTTP responses, JSON responses, and basic API structure.', 'Create a simple PHP endpoint returning JSON.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a PHP endpoint that returns a collection of records as JSON.', 'Keep the API simple and classroom-safe.'),
    (3, 3, 16, 'PHP API Connected to MySQL', 'Teach students how backend APIs query a database and return data in JSON format.', 'Connect PHP to MySQL. Use SELECT queries. Return JSON. Handle basic database errors.', 'Explain PHP + MySQL API flow, database queries, JSON creation, and error handling.', 'Create an API endpoint that retrieves database records.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Build a PHP endpoint that retrieves records from MySQL and returns them as JSON.', 'Use fictional classroom data.'),
    (3, 4, 17, 'JavaScript Fetch with a PHP API', 'Teach students how to consume API data in a frontend application.', 'Use fetch() with a PHP API endpoint. Parse JSON. Update HTML dynamically. Handle errors.', 'Explain API consumption, fetch requests, JSON responses, and dynamic updates in the browser.', 'Connect a JavaScript frontend to a PHP API.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Use JavaScript fetch() to retrieve records from a PHP API and display them dynamically.', 'Relate this to real user interfaces that update from server data.'),
    (3, 4, 18, 'Sending Data to a Backend API', 'Teach students how to send data from a frontend application to a backend service.', 'Use POST requests. Use JSON request bodies. Use headers. Send form data. Handle server responses.', 'Explain POST requests, JSON bodies, form submission, and sending data to a server.', 'Submit data from JavaScript to PHP.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a frontend form that sends data to a PHP backend endpoint.', 'Use fictional data and safe test inputs.'),
    (4, 1, 19, 'Advanced Authentication', 'Teach students how login systems work in real web applications.', 'Understand login systems. Understand sessions. Understand logout. Understand authentication state. Understand protected pages.', 'Explain users, authentication, sessions, login/logout, and protected page access.', 'Create a login/logout workflow.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Implement a basic PHP session-based login and logout system using test accounts only.', 'Never use real credentials.'),
    (4, 1, 20, 'Authorization and User Roles', 'Teach students the difference between authentication and authorization.', 'Understand authentication vs authorization. Identify user roles. Check permissions. Protect functionality appropriately.', 'Explain user roles, authorizations, administrator vs regular user, and permissions.', 'Create different permissions for different user roles.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Implement a simple role check that allows one user type to access functionality that another user type cannot access.', 'Use fictional test-user roles.'),
    (4, 2, 21, 'Secure Database Programming', 'Teach students how to write safer database code for web applications.', 'Understand SQL injection. Use prepared statements. Use parameterized queries. Validate input. Escape output appropriately.', 'Explain SQL injection, parameterized queries, validation, and safe database interaction.', 'Identify vulnerable SQL code and replace it with safer prepared statements.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Convert an unsafe database query into a prepared statement and explain why the change improves security.', 'Do not perform attacks on real systems.'),
    (4, 3, 22, 'Secure Forms and User Input', 'Teach students how to make forms safe and reliable for real users.', 'Validate required fields. Use server-side validation. Use sanitization. Use safe error messages. Understand client-side vs server-side validation.', 'Explain validation rules, sanitization, server-side verification, and safe error handling.', 'Build a secure registration or data-entry form.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a form with server-side validation for required fields, valid email format, and safe input handling.', 'Use fictional email addresses only.'),
    (4, 3, 23, 'Password Security', 'Teach students how to protect user credentials in an application.', 'Understand why passwords must not be stored as plain text. Use password_hash(). Use password_verify(). Understand secure authentication principles.', 'Explain password hashing, verification, and secure credential handling.', 'Implement secure password hashing using test credentials.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a small PHP authentication example that stores and verifies hashed test passwords.', 'Never use real passwords or personal information.'),
    (4, 4, 24, 'Common Web Security Problems', 'Teach students to recognize and fix common web security issues.', 'Identify XSS, CSRF concepts, session security, insecure direct access, and sensitive information exposure.', 'Explain common vulnerabilities and how to reduce risk in web applications.', 'Analyze examples of vulnerable web applications.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Identify security problems in a sample application and propose a concrete fix for each one.', 'Keep security discussion appropriate for secondary-school learners.'),
    (5, 1, 25, 'Introduction to Git', 'Introduce version control as a way to track changes in software projects.', 'Understand version control. Understand repositories. Understand staging and commits. Understand commit history.', 'Explain repositories, staging, commits, and tracking changes over time.', 'Create a Git repository and make several commits.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Initialize a project repository, create files, stage changes, and create meaningful commits.', 'Students should understand the value of version history.'),
    (5, 1, 26, 'GitHub and Remote Repositories', 'Teach students how to use GitHub to share and collaborate on projects.', 'Understand GitHub. Understand remote repositories. Understand push, pull, clone, and repository organization.', 'Explain remote repositories, collaboration, and common GitHub workflow steps.', 'Publish a classroom project to a GitHub repository.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create or use a classroom GitHub repository and push a project to it.', 'Use classroom-safe repository names and examples.'),
    (5, 2, 27, 'Preparing a Web Application for Deployment', 'Teach students how production environments differ from development environments.', 'Understand production vs development. Understand configuration. Understand environment variables. Understand deployment security considerations.', 'Explain deployment preparation, configuration values, environment variables, and production security.', 'Prepare a small application for deployment.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a deployment checklist for a PHP/MySQL application and identify configuration values that should not be exposed publicly.', 'Focus on safe configuration and best practice.'),
    (5, 2, 28, 'Web Application Deployment', 'Teach students the practical steps involved in deploying a web application.', 'Understand hosting, domains, servers, deployment process, database deployment, and post-deployment testing.', 'Explain hosting, domain basics, deployment steps, and testing after production launch.', 'Deploy a simple web project using a suitable classroom-compatible hosting environment.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Deploy or simulate the deployment of a small web application and verify that its main pages work correctly.', 'Use classroom-friendly hosting examples.'),
    (6, 1, 29, 'Requirements and Project Planning', 'Teach students how to define and plan a full-stack project before building it.', 'Identify a problem. Define users and roles. List features. Set project scope. Create functional requirements.', 'Explain requirements gathering, user roles, features, and project scope.', 'Students define their project requirements.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create a project specification containing the application purpose, target users, user roles, and main features.', 'Teacher approval is required before students build the final product.'),
    (6, 1, 30, 'Database and Application Design', 'Teach students how to structure a complete full-stack application before coding.', 'Design a database schema. Identify entities. Understand relationships. Plan application pages and backend requirements.', 'Explain entities, relationships, database schema, and page structure.', 'Design the database and application structure.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create the database schema and application page structure for the final project.', 'This is the project blueprint.'),
    (6, 2, 31, 'Building the Frontend', 'Teach students to build the visible part of a full-stack application.', 'Use HTML structure. Use CSS. Use responsive layout. Use JavaScript. Build forms and interfaces.', 'Explain frontend structure, styling, layout, user interface organization, and forms.', 'Build the frontend of the final application.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Implement at least one major frontend page of the final project with HTML, CSS, and JavaScript.', 'Focus on usability and clear interfaces.'),
    (6, 2, 32, 'Frontend Interaction and Validation', 'Teach students how JavaScript improves usability and data quality in a web application.', 'Use events. Handle form input. Add validation. Update interface elements dynamically.', 'Explain events, form handling, client-side validation, and dynamic updates.', 'Add interactive behavior to the project.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Add JavaScript interaction and client-side validation to a major project form.', 'Keep validation meaningful and user-focused.'),
    (6, 3, 33, 'PHP Backend Implementation', 'Teach students how to build the server-side logic for their final project.', 'Connect PHP to a database. Validate input on the server. Run CRUD operations. Organize backend logic.', 'Explain the backend architecture, database connection, request handling, and logic organization.', 'Implement backend functionality.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Implement one complete backend operation using PHP and MySQL.', 'Teacher checks that the server logic works correctly.'),
    (6, 3, 34, 'API and Frontend Integration', 'Teach students how the frontend and backend communicate in a real application.', 'Use API endpoints. Use fetch(). Work with JSON. Handle errors. Connect frontend features to server data.', 'Explain API endpoints, request/response flow, JSON, and frontend/backend integration.', 'Connect frontend components to the PHP backend.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Connect one project frontend feature to a PHP API and display the returned data.', 'This is the bridge between front-end and back-end learning.'),
    (6, 4, 35, 'Project Authentication', 'Teach students how to protect parts of a full-stack application using login and session logic.', 'Create login and logout. Use sessions. Use password hashing. Protect pages or functions.', 'Explain authentication, sessions, login workflows, and protected functionality.', 'Add authentication to the final project where appropriate.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Implement or integrate a secure authentication component using test accounts.', 'Use fictional users only.'),
    (6, 4, 36, 'Project Security Review', 'Teach students how to review and improve the security of a project before final submission.', 'Review prepared statements. Review validation. Review output escaping. Review authorization. Review configuration.', 'Explain prepared statements, authorization, input validation, secure configuration, and common vulnerabilities.', 'Perform a security review of the project.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Identify and fix at least three security or validation issues in the project.', 'Focus on practical improvements.'),
    (6, 5, 37, 'Testing and Debugging', 'Teach students to validate their final project and fix issues before presentation.', 'Test features. Use test cases. Debug browser issues. Debug PHP and database problems.', 'Explain functional testing, debugging, browser tools, and error investigation.', 'Test the final project using a test checklist.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Create and execute test cases for the project''s major features and document discovered problems.', 'Students should test both success and failure scenarios.'),
    (6, 5, 38, 'Final Project Refinement', 'Teach students to finalize a polished and working full-stack application.', 'Improve usability. Clean up code. Check accessibility basics. Finalize project features.', 'Explain code clean-up, final verification, performance basics, and documentation.', 'Finalize the application.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Complete final corrections and verify that all major project features work correctly.', 'The project should be ready for demonstration.'),
    (6, 5, 39, 'Final Project Presentation', 'Students showcase the completed project and explain the systems behind it.', 'Demonstrate features. Explain architecture. Explain database design. Share challenges and solutions.', 'Review the complete full-stack process from planning to final presentation.', 'Students present and demonstrate their completed full-stack application.', 'IN-CLASS PRACTICAL ASSIGNMENT — approximately 30 minutes: Present the completed application, demonstrate its major features, and explain the technologies and database structure used.', 'Evaluate technical understanding and communication as well as functionality.');

  for class_record in
    select id, owner_id
    from public.classes
    where lower(name) = 'ns4'
      and owner_id = target_owner
  loop
    delete from public.lessons where class_id = class_record.id;
    delete from public.topics where unit_id in (select id from public.units where class_id = class_record.id);
    delete from public.units where class_id = class_record.id;

    for unit_record in
      select n, unit_titles[n] as title, unit_descriptions[n] as description
      from generate_series(1, 6) as n
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
          'NS4 topic: ' || topic_record.topic_title || '.',
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
