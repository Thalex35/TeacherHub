import { createFileRoute } from "@tanstack/react-router";

import { AssessmentsModule } from "@/components/assessments-module";

export const Route = createFileRoute("/_authenticated/evaluations")({
  head: () => ({
    meta: [
      { title: "Evaluations — TeacherHub" },
      {
        name: "description",
        content: "Quizzes, tests, exams, projects and practical evaluations with grade entry.",
      },
      { property: "og:title", content: "Evaluations — TeacherHub" },
      { property: "og:description", content: "Manage quizzes, tests, exams and projects." },
    ],
  }),
  component: () => (
    <AssessmentsModule
      mode="evaluation"
      title="Evaluations"
      description="Quizzes, tests, exams, projects and practical evaluations feed the gradebook automatically."
    />
  ),
});
