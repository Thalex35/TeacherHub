import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Plus,
  StickyNote,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
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

type QuickNote = {
  id: string;
  text: string;
  done: boolean;
};

const QUICK_NOTES_KEY = "teacherhub.quick-notes";

function Dashboard() {
  const a = useAcademics();
  const events = useEvents();
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(QUICK_NOTES_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved) as QuickNote[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [assessmentsOpen, setAssessmentsOpen] = useState(true);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    window.localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const value = draft.trim();
    if (!value) return;
    setNotes((current) => [
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        text: value,
        done: false,
      },
      ...current,
    ]);
    setDraft("");
  };

  const toggleNote = (id: string) =>
    setNotes((current) =>
      current.map((note) => (note.id === id ? { ...note, done: !note.done } : note)),
    );

  const removeNote = (id: string) => setNotes((current) => current.filter((note) => note.id !== id));

  const currentPeriod =
    a.periods.find((p) => p.id === a.settings?.current_period_id) ??
    a.periods.find((p) => p.is_current) ??
    a.periods[0];
  const activeClasses = a.classes.filter((c) => c.is_active);
  const classPerformance = activeClasses
    .map((classItem) => ({
      classItem,
      average: a.classAverage(classItem.id, currentPeriod?.id),
      count: a.students.filter(
        (student) => student.class_id === classItem.id && student.status === "active",
      ).length,
    }))
    .sort((left, right) => {
      if (left.average === null) return 1;
      if (right.average === null) return -1;
      return left.average - right.average;
    });
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
        <Stat icon={Users} label="Active students" value={activeStudents.length} />
        <Stat icon={GraduationCap} label="Classes" value={activeClasses.length} />
        <Stat
          icon={ClipboardList}
          label={`${currentPeriod?.name ?? "Period"} assessments`}
          value={a.assessments.filter((x) => x.period_id === currentPeriod?.id).length}
        />
        <Stat icon={CalendarDays} label="Upcoming events" value={upcomingEvents.length} />
      </div>

      <section className="mt-8 grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Panel
            title="Upcoming events"
            empty="No upcoming events."
            items={upcomingEvents.length}
            prominent
          >
            {upcomingEvents.map((e) => (
              <Row
                key={e.id}
                left={e.title}
                sub={`${titleCase(e.event_type)}${e.class_id ? ` · ${classById.get(e.class_id)?.name ?? ""}` : ""}`}
                right={formatDate(e.event_date)}
                prominent
              />
            ))}
          </Panel>

          <div className="surface p-4">
            <button
              type="button"
              onClick={() => setAssessmentsOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={assessmentsOpen}
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Recent assessments
              </span>
              <ChevronDown className={`size-4 transition-transform ${assessmentsOpen ? "rotate-180" : ""}`} />
            </button>
            {assessmentsOpen ? (
              recentAssessments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No assessments recorded.
                </p>
              ) : (
                <div className="mt-3 divide-y divide-border">
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
                </div>
              )
            ) : null}
          </div>

          <div className="surface p-4">
            <div className="mb-4 flex items-center gap-2">
              <StickyNote className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Quick notes</h2>
            </div>
            <div className="flex min-w-0 flex-wrap gap-2 sm:flex-nowrap">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") addNote();
                }}
                placeholder="Add a classroom reminder"
                className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-primary"
              />
              <Button type="button" onClick={addNote} size="sm" className="shrink-0 gap-2">
                <Plus className="size-4" /> Add
              </Button>
            </div>
            <div className="mt-4 space-y-2">
              {notes.length === 0 ? (
                <div className="rounded-md border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                  No reminders yet. Add one to keep track of follow-ups.
                </div>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="flex items-start gap-3 rounded-md border border-border bg-background p-3">
                    <button
                      type="button"
                      onClick={() => toggleNote(note.id)}
                      className={
                        "mt-0.5 grid size-5 place-items-center rounded-full border " +
                        (note.done
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/40 bg-transparent text-transparent")
                      }
                      aria-label={note.done ? "Mark note as incomplete" : "Mark note as complete"}
                    >
                      <Check className="size-3" />
                    </button>
                    <p className={"flex-1 text-sm " + (note.done ? "text-muted-foreground line-through" : "text-foreground")}>
                      {note.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeNote(note.id)}
                      className="grid size-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Delete note"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface p-4">
        <h2 className="mb-3 text-lg font-semibold">Classes performance</h2>
        {activeClasses.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No classes yet"
            description="Create your first class to start managing students and curriculum."
          />
          ) : (
            <div className="grid gap-3">
              {classPerformance.map(({ classItem: c, count, average }) => {
                const performance = getPerformanceLevel(average, a.scale);
              return (
                <Link
                  key={c.id}
                  to="/classes/$classId"
                  params={{ classId: c.id }}
                  className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/50"
                >
                    <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-base font-semibold">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{count} students</span>
                  </div>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Period average</p>
                        <p className="numeric text-xl font-semibold">
                          {average === null ? "—" : `${average}/${a.scale}`}
                        </p>
                      </div>
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${performance.className}`}>
                        {performance.label}
                      </span>
                    </div>
                </Link>
              );
            })}
          </div>
        )}
          </div>

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
      </section>
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
  prominent = false,
}: {
  title: string;
  children: React.ReactNode;
  items: number;
  empty: string;
  prominent?: boolean;
}) {
  return (
    <div className={`surface ${prominent ? "p-5" : "p-4"}`}>
      <h3 className={`mb-3 font-semibold uppercase tracking-wide text-muted-foreground ${prominent ? "text-base" : "text-sm"}`}>
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

function Row({ left, sub, right, prominent = false }: { left: string; sub?: string; right?: string; prominent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className={`truncate font-medium ${prominent ? "text-base" : "text-sm"}`}>{left}</p>
        {sub ? <p className="truncate text-xs text-muted-foreground">{sub}</p> : null}
      </div>
      <span className="numeric shrink-0 text-sm text-muted-foreground">{right}</span>
    </div>
  );
}

function getPerformanceLevel(average: number | null, scale: number) {
  if (average === null) {
    return {
      label: "No data",
      className: "border-border bg-muted text-muted-foreground",
    };
  }
  if (average / scale >= 0.7) {
    return {
      label: "Strong",
      className: "border-success/30 bg-success/10 text-success",
    };
  }
  if (average / scale >= 0.5) {
    return {
      label: "Watch",
      className: "border-warning/40 bg-warning/15 text-warning-foreground",
    };
  }
  return {
    label: "Needs support",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  };
}
