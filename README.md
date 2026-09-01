# Teacher's Desk

Build a Full-Stack Teacher Management Platform

Build a modern, responsive, professional full-stack web application called TeacherHub.

The application will initially be used by one teacher to manage Informatics classes, but the architecture MUST be designed so that it can later support multiple teachers and multiple subjects.

The first implementation should focus on the Informatics teacher workflow.

1. Core concept

This is a private teacher management system for managing:

Classes

Students

Curriculum

Units and topics

Lessons

Practical assignments

Grades

Quizzes

Tests

Exams/evaluations

Attendance

Calendar events

Reports

Academic periods

Final grades

There should be NO student-facing account system in the first version.

The teacher is the main user and manages all academic data.

Do not build unnecessary social features, messaging, parent accounts, student accounts, or homework functionality.

There is NO homework system.

2. Initial academic structure

The first subject is:

Informatics

The initial classes are:

7e

8e

9e

NS1

NS2

NS3

NS4

The curriculum should be reusable every academic year.

Do NOT hard-code the curriculum directly into the UI.

Use a database structure where:

Academic Year → Subject → Class → Unit → Topic → Lesson → Assignment/Evaluation

The teacher should be able to create, edit, reorder, activate/deactivate, and reuse curriculum content.

3. Dashboard

Create a clean dashboard that gives the teacher an immediate overview.

Display:

Total classes

Total active students

Upcoming events

Upcoming evaluations

Recent assignments

Recent grades

Class averages

Current academic period

Current academic year

Display a summary card for each class:

Example:

7e

28 students

Average: 8.2/10

8e

31 students

Average: 7.8/10

etc.

The dashboard should be visually clean and easy to understand.

4. Classes

Create a Classes module.

The teacher must be able to:

Add a class

Edit a class

Delete/deactivate a class

View students in a class

View the class average

View class grades

View class attendance

View class curriculum

View class assignments

View class evaluations

A class should be associated with:

Academic year

Subject

Class name

Optional section

Do not assume there will always be exactly seven classes.

The system must allow additional classes to be created later.

5. Students

Keep student information SIMPLE.

Each student should have ONLY:

First name

Last name

Student ID

Class

Status

Status options:

Active

Inactive

Do NOT add unnecessary student information such as:

Address

Date of birth

Phone number

Parent information

Email

Medical information

The teacher must be able to:

Add student

Edit student

Change class

Change status

Delete/deactivate student

Search students

Filter students by class

View student profile

The student profile should show:

Basic student information

Grades

Assignments

Evaluations

Attendance

Academic averages

Final grade

6. Curriculum

Create a complete curriculum management system.

Structure:

Academic Year
→ Subject
→ Class
→ Unit
→ Topic
→ Lesson

The teacher must be able to:

Create units

Create topics

Create lessons

Edit lessons

Delete lessons

Reorder lessons

Mark lessons as completed

View curriculum progress

Each lesson should contain:

Title

Class

Unit

Topic

Description

Learning objectives

Estimated duration

Theory section

Practical activity

Assignment section

Notes

Completion status

The teacher should be able to reuse the curriculum for future academic years.

7. Lesson Planner

Create a dedicated Lesson Planner.

The teacher should be able to create a lesson plan with:

Date

Class

Subject

Unit

Topic

Lesson title

Learning objectives

Theory duration

Demonstration/practical duration

Assignment duration

Teacher notes

Completion status

The typical class structure can support a 2-hour lesson.

Example:

30 minutes — theory

30 minutes — demonstration/practice

30 minutes — practical assignment

30 minutes — correction/review

This structure should remain configurable rather than hard-coded.

The teacher must be able to mark a lesson:

Planned

In progress

Completed

Skipped

8. Assignments

There is NO homework system.

Assignments are practical exercises completed DURING CLASS.

After teaching a topic, the teacher may use approximately the final 30 minutes of the lesson for a practical assignment.

Create an Assignments module.

The teacher can:

Create assignment

Edit assignment

Delete assignment

Assign it to a class

Associate it with a lesson

Associate it with a unit/topic

Set date

Set maximum grade

Add instructions

Enter student grades

Assignment fields:

Title

Description

Class

Subject

Academic year

Unit

Topic

Lesson

Date

Maximum grade

Academic period

The teacher should be able to enter grades for the entire class from one screen.

Example:

Student | Grade

Jean Pierre | 8/10
Marie Joseph | 9/10
David Louis | 7/10

Make grade entry fast and convenient.

9. Gradebook

Create a powerful Gradebook.

The teacher must be able to filter grades by:

Class

Student

Assignment

Unit

Topic

Date

Academic period

Evaluation type

Evaluation types should include:

Assignment

Quiz

Test

Exam

Project

Practical evaluation

Custom

The teacher should be able to create custom evaluation types later.

The Gradebook should automatically calculate:

Student average

Class average

Assignment average

Evaluation average

Academic period average

Overall average

Final grade

Do not permanently hard-code grade weights.

Create configurable grading rules.

For example:

Assignments: 40%
Quizzes: 20%
Tests: 20%
Exam: 20%

But the teacher must be able to change these weights in Settings.

The system must validate that configured weights are mathematically valid.

10. Final Grade System

This is one of the most important features.

At the end of every academic period, the application must calculate the student's final grade automatically based on the configured grading rules.

Example:

Assignments average: 8.5/10
Quizzes average: 7.8/10
Tests average: 8.2/10
Exam: 9/10

The application calculates the final period grade automatically.

The teacher should be able to see:

Student
→ Assignment average
→ Quiz average
→ Test average
→ Exam grade
→ Final grade

The final grade should never require manual calculation.

Allow the teacher to override a calculated grade ONLY if explicitly enabled, and clearly mark an overridden grade.

11. Academic Periods

Create configurable academic periods.

Do not hard-code "Term 1", "Term 2", etc.

The teacher/admin should be able to create:

Period name

Start date

End date

Status

Grade calculation rules

Examples:

Control 1

Control 2

Semester 1

Semester 2

Final

The system should support different academic structures in future schools.

12. Evaluations / Exams

Create an Evaluations module.

The teacher can create:

Quiz

Test

Exam

Practical evaluation

Project

Custom evaluation

Each evaluation contains:

Name

Class

Subject

Academic year

Academic period

Date

Maximum grade

Weight

Description

Status

The teacher can enter grades for the whole class.

Grades automatically flow into the Gradebook and final-grade calculations.

13. Calendar

Create a full calendar.

The teacher can create events such as:

Class

Assignment

Quiz

Test

Exam

Practical evaluation

Project

Other

Each event can contain:

Title

Description

Date

Start time

End time

Class

Subject

Event type

Calendar views:

Month

Week

Day

Allow events to be edited and deleted.

Show upcoming events on the Dashboard.

14. Attendance

Create an Attendance module.

For each class session, the teacher can record:

Present

Absent

Late

Excused

The teacher should be able to mark attendance for the entire class quickly.

Calculate:

Attendance count

Absence count

Late count

Attendance percentage

Show attendance information inside the student profile and class reports.

15. Reports

Create a Reports module.

Reports should include:

Student Report

Student information

Class

Grades

Assignment averages

Evaluation grades

Attendance

Academic period average

Final grade

Class Report

All students

Grades

Averages

Attendance

Class average

Highest grade

Lowest grade

Academic Period Report

Student final grades

Class averages

Performance summary

Reports should be printable and exportable.

Support PDF export where practical.

16. Search and filtering

The application should have fast search and filtering.

The teacher should be able to filter information by:

Class

Student

Subject

Assignment

Unit

Topic

Date

Academic period

Evaluation type

Status

Use reusable filter components throughout the application.

17. Settings

Create a Settings section.

Settings should include:

School

School name

School information

Academic year

Teacher

Teacher name

Subject

Grading

Default grading scale

Maximum grade

Grade weights

Decimal precision

Academic periods

Create/edit periods

Start/end dates

Classes

Create/edit classes

Subjects

Create/edit subjects

The system must be designed so that more subjects can be added later.

18. Multi-subject architecture

Although the first version is for Informatics, DO NOT design the database as if Informatics is the only subject that will ever exist.

Use a structure similar to:

Teacher
→ Subject
→ Class
→ Academic Year
→ Curriculum
→ Lessons
→ Assignments
→ Evaluations
→ Grades

Later I should be able to add:

Mathematics

French

English

Physics

History

etc.

without rebuilding the application.

The first user interface can still prioritize Informatics.

19. Future multi-teacher architecture

The current version can be optimized for one teacher, but the database architecture should support multiple teachers in the future.

Do not create unnecessary multi-user complexity yet.

However, entities such as:

Teacher

Subject

Class

Academic Year

should be modeled independently so the application can later support multiple teachers.

20. Data persistence

Use a proper relational database.

All important information must persist between sessions:

Students

Classes

Curriculum

Lessons

Assignments

Grades

Evaluations

Attendance

Calendar events

Academic periods

Settings

Do not use temporary browser-only state as the primary data store.

21. UI/UX

Create a professional teacher-oriented interface.

Design goals:

Clean

Modern

Fast

Minimal

Easy to navigate

Desktop-friendly

Responsive

Accessible

Use a clear sidebar navigation.

Suggested navigation:

Dashboard
Students
Classes
Curriculum
Lesson Planner
Assignments
Gradebook
Attendance
Calendar
Evaluations
Reports
Settings

Use cards, tables, tabs, dialogs, forms, filters and charts where appropriate.

Avoid excessive animations.

The application should feel like a serious school administration tool, not a social media application.

22. Data integrity

Implement proper validation.

Examples:

A grade cannot exceed the maximum grade.

A grade cannot be negative.

Academic period dates must be valid.

Grade weights must be valid.

A student must belong to a valid class.

An assignment must belong to a valid lesson/class where applicable.

Deactivated students should remain in historical grade records.

Deleting data should require confirmation.

Never silently delete important academic data.

Prefer soft deletion/deactivation for students, classes and curriculum records where appropriate.

23. Empty states and error handling

Every module must have useful empty states.

Example:

"No assignments have been created for this class yet."

Provide:

Create Assignment

Buttons where appropriate.

Forms must show clear validation messages.

Handle loading and database errors gracefully.

24. Seed/demo data

Create realistic demo data for testing.

Include:

7 classes

Several students per class

Sample curriculum

Sample lessons

Sample assignments

Sample grades

Sample evaluations

Sample calendar events

Sample attendance records

Use realistic but fictional student names.

Make it easy to remove demo data later.

25. Important implementation requirement

Build the application as a real full-stack application, not merely a static frontend prototype.

Use:

TypeScript

React

Tailwind CSS

shadcn/ui

A proper relational PostgreSQL database

Secure database access

Clean reusable components

Proper data relationships

Use the platform's recommended backend/database architecture.

Create a clean and maintainable codebase.

26. Development priorities

Build in this order:

Database schema and relationships

Core application layout/navigation

Academic years, subjects and classes

Students

Curriculum

Lesson Planner

Assignments

Evaluations

Gradebook and automatic grade calculations

Attendance

Calendar

Reports

Settings

Dashboard analytics

Validation, error handling and polish

Do not sacrifice database correctness for visual appearance.

27. Final requirement

Before considering the application complete, verify that this workflow works end-to-end:

Create academic year
→ Create subject
→ Create class
→ Add students
→ Create curriculum
→ Create lesson
→ Create practical assignment
→ Enter student grades
→ Create quiz/test/exam
→ Enter evaluation grades
→ Record attendance
→ Configure grade weights
→ Calculate academic period grades
→ Generate student report
→ Generate class report
→ View everything from the Dashboard

Every part of this workflow must use persistent database data.

Build this as the foundation of a long-term Teacher Management Platform, starting with Informatics but architected for expansion to all subjects and eventually multiple teachers.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41a40b30-ffc8-4e33-a138-668ded433e0e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
