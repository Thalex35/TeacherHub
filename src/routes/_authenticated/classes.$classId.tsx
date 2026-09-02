import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAttendance, useLessons, useTopics, useUnits } from "@/lib/data";
import { Input } from "@/components/ui/input";
import { attendanceStats } from "@/lib/calc";
import { formatDate, titleCase } from "@/lib/format";
import { useAcademics } from "@/lib/useAcademics";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class details — TeacherHub" },
      {
        name: "description",
        content: "Students, curriculum, assessments and attendance for a single class.",
      },
      { property: "og:title", content: "Class details — TeacherHub" },
      { property: "og:description", content: "A complete view of one class." },
    ],
  }),
  component: ClassDetail,
});

function ClassDetail() {
  const { classId } = Route.useParams();
  const a = useAcademics();
  const units = useUnits();
  const topics = useTopics();
  const lessons = useLessons();
  const attendance = useAttendance();

  const klass = a.classes.find((c) => c.id === classId);
  const students = a.students.filter((s) => s.class_id === classId);
  const classAssessments = a.assessments.filter((x) => x.class_id === classId);
  const classUnits = (units.data ?? []).filter((u) => u.class_id === classId);
  const classLessons = (lessons.data ?? []).filter((l) => l.class_id === classId);
  const classAttendance = (attendance.data ?? []).filter((r) => r.class_id === classId);
  const typeName = (id: string) => a.types.find((t) => t.id === id)?.name ?? "—";
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatus, setStudentStatus] = useState<"all" | "active" | "inactive">("all");

  const filteredStudents = students.filter((student) => {
    const query = studentSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      `${student.first_name} ${student.last_name} ${student.student_code}`
        .toLowerCase()
        .includes(query);
    return matchesSearch && (studentStatus === "all" || student.status === studentStatus);
  });

  if (a.loading || units.isLoading || topics.isLoading || lessons.isLoading || attendance.isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading class dashboard...</p>;
  }

  if (!klass) {
    return (
      <div>
        <PageHeader title="Class not found" />
        <Button asChild variant="outline">
          <Link to="/classes">Back to classes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-3">
        <Link to="/classes">
          <ArrowLeft className="size-4" /> Classes
        </Link>
      </Button>
      <PageHeader
        title={`${klass.name}${klass.section ? ` · ${klass.section}` : ""}`}
        description={`${students.filter((s) => s.status === "active").length} active students · class average ${
          a.classAverage(classId) === null ? "—" : `${a.classAverage(classId)}/${a.scale}`
        }`}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Metric label="All students" value={String(students.length)} />
        <Metric label="Active students" value={String(students.filter((s) => s.status === "active").length)} />
        <Metric label="Class average" value={a.classAverage(classId) === null ? "—" : `${a.classAverage(classId)}/${a.scale}`} />
      </div>

      <Tabs defaultValue="students">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <Input
              value={studentSearch}
              onChange={(event) => setStudentSearch(event.target.value)}
              placeholder="Search student name or ID"
              className="sm:max-w-sm"
            />
            <select
              value={studentStatus}
              onChange={(event) => setStudentStatus(event.target.value as typeof studentStatus)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              aria-label="Filter students by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="surface overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <Link
                        to="/students/$studentId"
                        params={{ studentId: s.id }}
                        className="hover:underline"
                      >
                        {s.first_name} {s.last_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.student_code}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>
                        {titleCase(s.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="numeric text-right">
                      {a.studentAverage(s.id) === null
                        ? "—"
                        : `${a.studentAverage(s.id)}/${a.scale}`}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No students match the current filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="curriculum">
          {classUnits.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No curriculum has been created for this class yet.
            </p>
          ) : (
            <div className="space-y-4">
              {classUnits.map((u) => (
                <div key={u.id} className="surface p-4">
                  <h3 className="font-semibold">{u.title}</h3>
                  <p className="text-sm text-muted-foreground">{u.description}</p>
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {(topics.data ?? [])
                      .filter((t) => t.unit_id === u.id)
                      .map((t) => (
                        <li key={t.id}>
                          <span className="font-medium">{t.title}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            ·{" "}
                            {classLessons.filter((l) => l.topic_id === t.id).length} lesson(s)
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assessments">
          <div className="surface overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead className="text-right">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classAssessments.map((x) => (
                  <TableRow key={x.id}>
                    <TableCell className="font-medium">{x.title}</TableCell>
                    <TableCell>{typeName(x.evaluation_type_id)}</TableCell>
                    <TableCell>{formatDate(x.date)}</TableCell>
                    <TableCell className="numeric text-right">{Number(x.max_grade)}</TableCell>
                    <TableCell className="numeric text-right">
                      {a.assessmentAverage(x.id) ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {classAssessments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No assessments have been created for this class yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="surface overflow-x-auto">
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
                  const st = attendanceStats(classAttendance.filter((r) => r.student_id === s.id));
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.first_name} {s.last_name}
                      </TableCell>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="numeric text-2xl font-semibold">{value}</p>
    </div>
  );
}
