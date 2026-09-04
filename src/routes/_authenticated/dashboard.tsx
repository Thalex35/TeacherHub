import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, GraduationCap, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import { useAcademics } from "@/lib/useAcademics";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TeacherHub" },
      {
        name: "description",
        content: "Overview of classes, students, averages, upcoming events and recent grades.",
      },
      { property: "og:title", content: "Dashboard — TeacherHub" },
      { property: "og:description", content: "Your teaching overview at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const a = useAcademics();
  const events = useEvents();
  const today = new Date().toISOString().slice(0, 10);

  const currentPeriod =
    a.periods.find((p) => p.id === a.settings?.current_period_id) ??
    a.periods.find((p) => p.is_current) ??
    a.periods[0];
  const activeClasses = a.classes.filter((c) => c.is_active);
  const activeStudents = a.students.filter((s) => s.status === "active");
  const upcomingEvents = (events.data ?? []).filter((e) => e.event_date >= today).slice(0, 6);
  const upcomingEvaluations = a.assessments
    .filter((x) => x.date >= today && x.period_id === currentPeriod?.id)
    .sort((x, y) => x.date.localeCompare(y.date))
    .slice(0, 5);
  const recentAssessments = [...a.assessments]
    .filter((x) => x.date <= today && x.period_id === currentPeriod?.id)
    .slice(0, 5);
  const recentGrades = [...a.grades]
    .filter((grade) => {
      const assessment = a.assessments.find((item) => item.id === grade.assessment_id);
      return assessment?.period_id === currentPeriod?.id;
    })
    .sort((x, y) => (y.updated_at ?? "").localeCompare(x.updated_at ?? ""))
    .slice(0, 6);

  const classById = new Map(a.classes.map((c) => [c.id, c]));
  const studentById = new Map(a.students.map((s) => [s.id, s]));
  const assessmentById = new Map(a.assessments.map((x) => [x.id, x]));

  if (a.loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`${a.settings?.school_name ?? "School"} · ${currentPeriod?.name ?? "No period"} · ${a.settings?.teacher_name ?? ""}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={GraduationCap} label="Classes" value={activeClasses.length} />
        <Stat icon={Users} label="Active students" value={activeStudents.length} />
        <Stat
          icon={ClipboardList}
          label={`${currentPeriod?.name ?? "Period"} assessments`}
          value={a.assessments.filter((x) => x.period_id === currentPeriod?.id).length}
        />
        <Stat icon={CalendarDays} label="Upcoming events" value={upcomingEvents.length} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Classes</h2>
        {activeClasses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No classes yet"
            description="Create your first class to start managing students and curriculum."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {activeClasses.map((c) => {
              const count = a.students.filter(
                (s) => s.class_id === c.id && s.status === "active",
              ).length;
              const average = a.classAverage(c.id, currentPeriod?.id);
              return (
                <Link
                  key={c.id}
                  to="/classes/$classId"
                  params={{ classId: c.id }}
                  className="surface p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-semibold">{c.name}</span>
                    <Badge variant="secondary">{count} students</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">Period average</p>
                  <p className="numeric text-2xl font-semibold">
                    {average === null ? "—" : `${average}/${a.scale}`}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Upcoming events" empty="No upcoming events." items={upcomingEvents.length}>
          {upcomingEvents.map((e) => (
            <Row
              key={e.id}
              left={e.title}
              sub={`${titleCase(e.event_type)}${e.class_id ? ` · ${classById.get(e.class_id)?.name ?? ""}` : ""}`}
              right={formatDate(e.event_date)}
            />
          ))}
        </Panel>

        <Panel
          title="Upcoming evaluations"
          empty="Nothing scheduled."
          items={upcomingEvaluations.length}
        >
          {upcomingEvaluations.map((x) => (
            <Row
              key={x.id}
              left={x.title}
              sub={classById.get(x.class_id)?.name ?? ""}
              right={formatDate(x.date)}
            />
          ))}
        </Panel>

        <Panel
          title="Recent assessments"
          empty="No assessments recorded."
          items={recentAssessments.length}
        >
          {recentAssessments.map((x) => (
            <Row
              key={x.id}
              left={x.title}
              sub={classById.get(x.class_id)?.name ?? ""}
              right={
                a.assessmentAverage(x.id) === null
                  ? formatDate(x.date)
                  : `avg ${a.assessmentAverage(x.id)}/${a.scale}`
              }
            />
          ))}
        </Panel>

        <Panel title="Recent grades" empty="No grades entered yet." items={recentGrades.length}>
          {recentGrades.map((g) => {
            const st = studentById.get(g.student_id);
            const asmt = assessmentById.get(g.assessment_id);
            return (
              <Row
                key={g.id}
                left={st ? `${st.first_name} ${st.last_name}` : "Student"}
                sub={asmt?.title ?? ""}
                right={g.score === null ? "—" : `${g.score}/${asmt?.max_grade ?? a.scale}`}
              />
            );
          })}
        </Panel>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="surface flex items-center gap-4 p-4">
      <div className="grid size-11 place-items-center rounded-md bg-secondary text-secondary-foreground">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="numeric text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
  items,
  empty,
}: {
  title: string;
  children: React.ReactNode;
  items: number;
  empty: string;
}) {
  return (
    <div className="surface p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {items === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="divide-y divide-border">{children}</div>
      )}
    </div>
  );
}

function Row({ left, sub, right }: { left: string; sub?: string; right?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{left}</p>
        {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
      </div>
      <span className="numeric shrink-0 text-sm text-muted-foreground">{right}</span>
    </div>
  );
}
