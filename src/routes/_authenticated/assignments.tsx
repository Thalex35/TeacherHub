import { createFileRoute } from "@tanstack/react-router";

import { AssessmentsModule } from "@/components/assessments-module";

export const Route = createFileRoute("/_authenticated/assignments")({
  head: () => ({
    meta: [
      { title: "Assignments — TeacherHub" },
      {
        name: "description",
        content: "Practical in-class assignments with fast whole-class grade entry.",
      },
      { property: "og:title", content: "Assignments — TeacherHub" },
      { property: "og:description", content: "Create assignments and grade a whole class quickly." },
    ],
  }),
  component: () => (
    <AssessmentsModule
      mode="assignment"
      title="Assignments"
      description="Practical exercises completed during class — no homework."
    />
  ),
});
