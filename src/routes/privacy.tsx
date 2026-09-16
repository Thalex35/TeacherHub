import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TeacherHub" },
      {
        name: "description",
        content:
          "TeacherHub privacy policy: how we collect, use, and protect teacher and student data in our educational platform.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          TeacherHub
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>

        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground">
          <p>
            TeacherHub is an educational management platform designed to help schools and teachers
            manage classes, students, curriculum, assessments, attendance, and reporting. This
            Privacy Policy explains how we handle personal and educational data within the service.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground">Information we collect</h2>
            <p>
              We may collect account information such as your name, email address, school name,
              teaching role, class information, student records, and other data necessary to operate
              the TeacherHub workspace. This may include information about assignment completion,
              attendance, grades, and teacher planning content.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">How we use this information</h2>
            <p>
              We use the information we collect to provide and improve the TeacherHub platform,
              support classroom administration, manage student records, facilitate communication,
              maintain school workflows, and generate reports. We do not use personal data for
              unrelated marketing or resale purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Data storage and security</h2>
            <p>
              We use commercially reasonable administrative, technical, and organizational measures
              to protect personal and educational data from unauthorized access, misuse, disclosure,
              or alteration. However, no system can be guaranteed completely secure, and we continue
              to improve our security practices.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Sharing and third parties</h2>
            <p>
              TeacherHub may use trusted infrastructure providers necessary to operate the service,
              such as authentication, hosting, and analytics support. We do not sell personal data.
              Information may also be shared when legally required or when necessary to maintain the
              security and integrity of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Your rights and choices</h2>
            <p>
              You may review, update, or remove account information through the application settings
              available to your workspace administrator or account owner. If you have concerns about
              your data, you should contact the relevant school administrator or support contact for
              the TeacherHub instance you are using.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Retention</h2>
            <p>
              We retain data only as long as necessary for the operation of the TeacherHub service,
              legal compliance, school administration, or support obligations. Data may be archived or
              deleted in accordance with internal policies and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Changes</h2>
            <p>
              This Privacy Policy may be updated from time to time to reflect changes in the service,
              legal requirements, or operational practices. Continued use of TeacherHub after any
              update indicates acceptance of the revised policy.
            </p>
          </section>
        </div>

        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
