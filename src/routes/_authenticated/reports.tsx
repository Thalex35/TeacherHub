import { createFileRoute } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import { useState } from "react";

import { FilterBar, FilterSelect } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { attendanceStats } from "@/lib/calc";
import { useAttendance } from "@/lib/data";
import { formatDate, fullName } from "@/lib/format";
import { useAcademics } from "@/lib/useAcademics";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — TeacherHub" },
      {
        name: "description",
        content: "Printable class summaries, student report cards and attendance reports.",
      },
      { property: "og:title", content: "Reports — TeacherHub" },
      { property: "og:description", content: "Generate printable academic reports." },
    ],
  }),
  component: ReportsPage,
});

type ReportKind = "class_summary" | "report_card" | "attendance";

function ReportsPage() {
  const a = useAcademics();
  const attendance = useAttendance();

  const [kind, setKind] = useState<ReportKind>("class_summary");
  const [classId, setClassId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [studentId, setStudentId] = useState("");

  const activeClass = classId || a.classes[0]?.id || "";
  const activePeriod = periodId || a.periods.find((p) => p.is_current)?.id || a.periods[0]?.id || "";
  const students = a.students.filter((s) => s.class_id === activeClass);
  const activeStudent = students.find((s) => s.id === studentId) ?? students[0];
  const klass = a.classes.find((c) => c.id === activeClass);
  const period = a.periods.find((p) => p.id === activePeriod);
  const rows = attendance.data ?? [];

  const title =
    kind === "class_summary"
      ? "Class summary"
      : kind === "report_card"
        ? "Student report card"
        : "Attendance report";

  return (
    <div>
      <div className="print:hidden">
        <PageHeader
          title="Reports"
          description="Generate a clean, printable document for any class, student or period."
          actions={
            <Button onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </Button>
          }
        />

        <FilterBar>
          <FilterSelect
            label="Report"
            value={kind}
            onChange={(v) => setKind(v as ReportKind)}
            includeAll={false}
            className="w-[200px]"
            options={[
              { value: "class_summary", label: "Class summary" },
              { value: "report_card", label: "Student report card" },
              { value: "attendance", label: "Attendance report" },
            ]}
          />
          <FilterSelect
            label="Class"
            value={activeClass}
            onChange={setClassId}
            includeAll={false}
            options={a.classes.map((c) => ({ value: c.id, label: c.name }))}
          />
          <FilterSelect
            label="Period"
            value={activePeriod}
            onChange={setPeriodId}
            includeAll={false}
            options={a.periods.map((p) => ({ value: p.id, label: p.name }))}
          />
          {kind === "report_card" ? (
            <FilterSelect
              label="Student"
              value={activeStudent?.id ?? ""}
              onChange={setStudentId}
              includeAll={false}
              className="w-[220px]"
              options={students.map((s) => ({ value: s.id, label: fullName(s) }))}
            />
          ) : null}
        </FilterBar>
      </div>

      <div className="surface p-6 print:border-0 print:p-0 print:shadow-none">
        <header className="mb-6 border-b border-border pb-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {a.settings?.school_name ?? "School"}
          </p>
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {klass?.name} · {period?.name} · Teacher: {a.settings?.teacher_name ?? "—"} ·{" "}
            {formatDate(new Date().toISOString().slice(0, 10))}
          </p>
        </header>

        {kind === "class_summary" ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                  <TableHead className="text-right">Final grade</TableHead>
                  <TableHead className="text-right">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const stats = attendanceStats(rows.filter((r) => r.student_id === s.id));
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{fullName(s)}</TableCell>
                      <TableCell className="numeric text-right">
                        {a.studentAverage(s.id, activePeriod) ?? "—"}
                      </TableCell>
                      <TableCell className="numeric text-right">
                        {a.finalGrade(s.id, activePeriod).value ?? "—"}
                      </TableCell>
                      <TableCell className="numeric text-right">
                        {stats.rate === null ? "—" : `${stats.rate}%`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <p className="mt-4 text-sm text-muted-foreground">
              Class average: {a.classAverage(activeClass, activePeriod) ?? "—"} / {a.scale} ·{" "}
              {students.length} students
            </p>
          </>
        ) : null}

        {kind === "report_card" && activeStudent ? (
          <>
            <div className="mb-4">
              <p className="text-lg font-semibold">{fullName(activeStudent)}</p>
              <p className="text-sm text-muted-foreground">
                Code {activeStudent.student_code} · {klass?.name}
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {a.assessments
                  .filter((x) => x.class_id === activeClass && x.period_id === activePeriod)
                  .sort((x, y) => x.date.localeCompare(y.date))
                  .map((x) => {
                    const g = a.grades.find(
                      (gr) => gr.assessment_id === x.id && gr.student_id === activeStudent.id,
                    );
                    return (
                      <TableRow key={x.id}>
                        <TableCell>{x.title}</TableCell>
                        <TableCell>
                          {a.types.find((t) => t.id === x.evaluation_type_id)?.name}
                        </TableCell>
                        <TableCell>{formatDate(x.date)}</TableCell>
                        <TableCell className="numeric text-right">
                          {g?.score === null || !g ? "—" : `${Number(g.score)} / ${Number(x.max_grade)}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SummaryCell label="Average" value={a.studentAverage(activeStudent.id, activePeriod)} />
              <SummaryCell
                label="Final grade"
                value={a.finalGrade(activeStudent.id, activePeriod).value}
              />
              <SummaryCell
                label="Attendance"
                value={attendanceStats(rows.filter((r) => r.student_id === activeStudent.id)).rate}
                suffix="%"
              />
            </div>
            <p className="mt-10 text-sm text-muted-foreground">
              Teacher signature: ______________________
            </p>
          </>
        ) : null}

        {kind === "attendance" ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="text-right">Present</TableHead>
                <TableHead className="text-right">Absent</TableHead>
                <TableHead className="text-right">Late</TableHead>
                <TableHead className="text-right">Excused</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const st = attendanceStats(rows.filter((r) => r.student_id === s.id));
                return (
                  <TableRow key={s.id}>
                    <TableCell>{fullName(s)}</TableCell>
                    <TableCell className="numeric text-right">{st.present}</TableCell>
                    <TableCell className="numeric text-right">{st.absent}</TableCell>
                    <TableCell className="numeric text-right">{st.late}</TableCell>
                    <TableCell className="numeric text-right">{st.excused}</TableCell>
                    <TableCell className="numeric text-right">
                      {st.rate === null ? "—" : `${st.rate}%`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
      </div>
    </div>
  );
}

function SummaryCell({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="numeric text-xl font-semibold">
        {value === null ? "—" : `${value}${suffix}`}
      </p>
    </div>
  );
}
