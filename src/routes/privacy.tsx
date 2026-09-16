import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — TeacherHub" },
      { name: "description", content: "TeacherHub privacy policy." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          TeacherHub
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>

        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground">
          <p>
            TeacherHub respects the privacy of its users. This Privacy Policy explains how we collect,
            use, and protect information in connection with the TeacherHub platform.
          </p>

          <section>
            <h2 className="text-base font-semibold text-foreground">Information we collect</h2>
            <p>
              We may collect information such as your name, email address, school details, class data,
              student records, and account settings required to provide the TeacherHub service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">How we use the information</h2>
            <p>
              We use this information to manage teacher and student records, support classroom
              operations, provide access to your workspace, and improve the experience of the product.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Data security</h2>
            <p>
              We use reasonable technical and organizational measures to protect your information from
              unauthorized access, disclosure, or misuse.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Sharing</h2>
            <p>
              We do not sell personal data. Information may be shared only with trusted service
              providers required to operate the platform, or when required by law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Your choices</h2>
            <p>
              You may update or delete account information through the application settings where
              available. If you have questions, contact the administrator or support contact for the
              TeacherHub instance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground">Changes</h2>
            <p>
              This policy may be updated from time to time. Continued use of TeacherHub after changes
              indicates acceptance of the updated policy.
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
