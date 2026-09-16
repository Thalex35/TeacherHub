import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — TeacherHub" },
      { name: "description", content: "TeacherHub terms of service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          TeacherHub
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <p>
            These Terms of Service govern the use of TeacherHub. By accessing or using the platform,
            you agree to be bound by these terms.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground">Use of the service</h2>
            <p>
              TeacherHub is intended for educational and administrative use by authorized teachers,
              schools, and related institutions. You must use the service lawfully and responsibly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Account responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account, password, and
              access credentials. You agree to notify the service administrator immediately if you
              suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Data and records</h2>
            <p>
              Users are responsible for the accuracy, legality, and appropriateness of the data they
              enter into the system, including student and classroom information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Service availability</h2>
            <p>
              We strive to keep TeacherHub available and reliable, but we do not guarantee uninterrupted
              access or error-free operation. The service may be updated, modified, or temporarily
              unavailable at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Termination</h2>
            <p>
              The service administrator may suspend or terminate access to the platform if a user
              violates these terms, misuses the platform, or poses a risk to data integrity or system
              security.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Changes</h2>
            <p>
              TeacherHub may update these terms at any time. Continued use of the service after changes
              means that you accept the revised terms.
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
