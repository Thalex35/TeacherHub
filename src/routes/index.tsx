import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TeacherHub — Teacher Management Platform" },
      {
        name: "description",
        content:
          "TeacherHub helps teachers manage classes, students, curriculum, assessments, attendance, and reporting in one secure workspace.",
      },
      { property: "og:title", content: "TeacherHub — Teacher Management Platform" },
      {
        property: "og:description",
        content:
          "A complete digital workspace for school administrators and teachers to run classes, track students, and plan instruction.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">TeacherHub</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              A simpler way to run your classes and teacher workspace.
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              TeacherHub helps schools and teachers manage classes, students, curriculum planning,
              attendance, assessments, grades, and reporting from one secure platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Request access
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            title="Class management"
            description="Create classes, track students, and maintain a clear view of your teaching groups."
          />
          <FeatureCard
            title="Curriculum & planning"
            description="Organize subject plans, learning sequences, assignments, and lesson preparation."
          />
          <FeatureCard
            title="Assessment & reporting"
            description="Record grades, follow student progress, and generate reports with less manual work."
          />
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
