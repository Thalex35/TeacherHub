import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { attendanceStats } from "@/lib/calc";
import { useAttendance } from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import { useAcademics } from "@/lib/useAcademics";

export const Route = createFileRoute("/_authenticated/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student profile — TeacherHub" },
      {
        name: "description",
        content: "Grades, assessments, attendance and final grade for a single student.",
      },
      { property: "og:title", content: "Student profile — TeacherHub" },
      { property: "og:description", content: "Complete academic record for one student." },
    ],
  }),
  component: StudentProfile,
});

function StudentProfile() {
  const { studentId } = Route.useParams();
  const a = useAcademics();
  const attendance = useAttendance();

  const student = a.students.find((s) => s.id === studentId);
  const currentPeriod = a.periods.find((p) => p.is_current) ?? a.periods[0];
  const rows = a.grades.filter((g) => g.student_id === studentId);
  const assessmentById = new Map(a.assessments.map((x) => [x.id, x]));
  const att = attendanceStats((attendance.data ?? []).filter((r) => r.student_id === studentId));
  const final = currentPeriod ? a.finalGrade(studentId, currentPeriod.id) : null;

  if (!student) {
    return (
      <div>
        <PageHeader title="Student not found" />
        <Button asChild variant="outline">
          <Link to="/students">Back to students</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/students">
          <ArrowLeft className="size-4" /> Students
        </Link>
      </Button>
      <PageHeader
        title={`${student.first_name} ${student.last_name}`}
        description={`${student.student_code} · ${a.classes.find((c) => c.id === student.class_id)?.name ?? "—"}`}
        actions={
          <Badge variant={student.status === "active" ? "default" : "secondary"}>
            {titleCase(student.status)}
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Overall average"
          value={
            a.studentAverage(studentId) === null
              ? "—"
              : `${a.studentAverage(studentId)}/${a.scale}`
          }
        />
        <Metric
          label={`${currentPeriod?.name ?? "Period"} average`}
          value={
            currentPeriod && a.studentAverage(studentId, currentPeriod.id) !== null
              ? `${a.studentAverage(studentId, currentPeriod.id)}/${a.scale}`
              : "—"
          }
        />
        <Metric
          label="Final grade"
          value={final?.value === null || final === null ? "—" : `${final.value}/${a.scale}`}
          {...(final?.overridden ? { hint: "Overridden" } : {})}
        />
        <Metric label="Attendance" value={att.rate === null ? "—" : `${att.rate}%`} />
      </div>

      {final ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Final grade breakdown — {currentPeriod?.name}</h2>
          <div className="surface overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Evaluation type</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Graded items</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {final.breakdown.map((b) => (
                  <TableRow key={b.typeId}>
                    <TableCell>{b.typeName}</TableCell>
                    <TableCell className="numeric text-right">{b.weight}%</TableCell>
                    <TableCell className="numeric text-right">{b.count}</TableCell>
                    <TableCell className="numeric text-right">
                      {b.average === null ? "—" : `${b.average}/${a.scale}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Grades</h2>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No grades have been recorded for this student yet.
          </p>
        ) : (
          <div className="surface overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((g) => {
                  const x = assessmentById.get(g.assessment_id);
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{x?.title ?? "—"}</TableCell>
                      <TableCell>
                        {a.types.find((t) => t.id === x?.evaluation_type_id)?.name ?? "—"}
                      </TableCell>
                      <TableCell>{formatDate(x?.date)}</TableCell>
                      <TableCell className="numeric text-right">
                        {g.score === null ? "—" : `${g.score}/${x?.max_grade ?? a.scale}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Attendance</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Metric label="Present" value={String(att.present)} />
          <Metric label="Absent" value={String(att.absent)} />
          <Metric label="Late" value={String(att.late)} />
          <Metric label="Excused" value={String(att.excused)} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="numeric text-2xl font-semibold">{value}</p>
      {hint ? <p className="text-xs text-warning-foreground">{hint}</p> : null}
    </div>
  );
}
