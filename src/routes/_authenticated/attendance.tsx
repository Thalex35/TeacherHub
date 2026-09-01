import { createFileRoute } from "@tanstack/react-router";
import { UserCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { FilterBar, FilterSelect } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { attendanceStats } from "@/lib/calc";
import { useAttendance, useUpsert } from "@/lib/data";
import { titleCase } from "@/lib/format";
import { useAcademics } from "@/lib/useAcademics";

export const Route = createFileRoute("/_authenticated/attendance")({
  head: () => ({
    meta: [
      { title: "Attendance — TeacherHub" },
      {
        name: "description",
        content: "Record present, absent, late and excused for a whole class in seconds.",
      },
      { property: "og:title", content: "Attendance — TeacherHub" },
      { property: "og:description", content: "Fast class attendance tracking and statistics." },
    ],
  }),
  component: AttendancePage,
});

const STATUSES = ["present", "absent", "late", "excused"] as const;

function AttendancePage() {
  const a = useAcademics();
  const attendance = useAttendance();
  const upsert = useUpsert("attendance", "student_id,session_date");

  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [draft, setDraft] = useState<Record<string, string>>({});

  const activeClass = classId || a.classes[0]?.id || "";
  const students = a.students.filter((s) => s.class_id === activeClass && s.status === "active");
  const rows = attendance.data ?? [];

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const s of students) {
      const existing = rows.find((r) => r.student_id === s.id && r.session_date === date);
      next[s.id] = existing?.status ?? "present";
    }
    setDraft(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeClass, date, attendance.dataUpdatedAt]);

  const save = async () => {
    if (!students.length) { toast.error("This class has no active students."); return; }
    await upsert.mutateAsync(
      students.map((s) => ({
        class_id: activeClass,
        student_id: s.id,
        session_date: date,
        status: draft[s.id] ?? "present",
      })),
    );
    toast.success("Attendance saved.");
  };

  const markAll = (status: string) => {
    const next: Record<string, string> = {};
    for (const s of students) next[s.id] = status;
    setDraft(next);
  };

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Record one session at a time; totals feed student profiles and class reports."
        actions={
          <>
            <Button variant="outline" onClick={() => markAll("present")}>
              Mark all present
            </Button>
            <Button onClick={save} disabled={upsert.isPending}>
              Save session
            </Button>
          </>
        }
      />

      <FilterBar>
        <FilterSelect
          label="Class"
          value={activeClass}
          onChange={setClassId}
          includeAll={false}
          options={a.classes.map((c) => ({ value: c.id, label: c.name }))}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Session date</Label>
          <Input
            type="date"
            className="w-[180px]"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </FilterBar>

      {students.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No active students in this class"
          description="Add students to the class before recording attendance."
        />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Session status</TableHead>
                <TableHead className="text-right">Overall rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const stats = attendanceStats(rows.filter((r) => r.student_id === s.id));
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.first_name} {s.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={draft[s.id] === st ? "default" : "outline"}
                            onClick={() => setDraft((d) => ({ ...d, [s.id]: st }))}
                          >
                            {titleCase(st)}
                          </Button>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="numeric text-right">
                      {stats.rate === null ? "—" : `${stats.rate}%`}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
