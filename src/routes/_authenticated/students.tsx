import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ALL, FilterBar, FilterSelect } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInsert, useRemove, useUpdate } from "@/lib/data";
import { titleCase } from "@/lib/format";
import type { Student } from "@/lib/types";
import { useAcademics } from "@/lib/useAcademics";

export const Route = createFileRoute("/_authenticated/students")({
  head: () => ({
    meta: [
      { title: "Students — TeacherHub" },
      { name: "description", content: "Search, filter and manage the students in your classes." },
      { property: "og:title", content: "Students — TeacherHub" },
      { property: "og:description", content: "Student roster and profiles." },
    ],
  }),
  component: StudentsPage,
});

const emptyForm = {
  first_name: "",
  last_name: "",
  student_code: "",
  class_id: "",
  status: "active",
};

function nextStudentCode(className: string, students: Student[]) {
  const escapedClassName = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^STU-${escapedClassName}-(\\d+)$`, "i");
  const highestNumber = students.reduce((highest, student) => {
    const match = pattern.exec(student.student_code);
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);
  return `STU-${className}-${String(highestNumber + 1).padStart(2, "0")}`;
}

function StudentsPage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const a = useAcademics();
  const insert = useInsert("students");
  const update = useUpdate("students");
  const remove = useRemove("students");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(emptyForm);

  if (pathname !== "/students") return <Outlet />;

  const filtered = a.students.filter((s) => {
    const q = search.trim().toLowerCase();
    const matches =
      !q ||
      `${s.first_name} ${s.last_name} ${s.student_code}`.toLowerCase().includes(q);
    return (
      matches &&
      (classFilter === ALL || s.class_id === classFilter) &&
      (statusFilter === ALL || s.status === statusFilter)
    );
  });

  const openNew = () => {
    setEditing(null);
    const classId = a.classes[0]?.id ?? "";
    const className = a.classes.find((klass) => klass.id === classId)?.name ?? "";
    setForm({
      ...emptyForm,
      class_id: classId,
      student_code: className ? nextStudentCode(className, a.students) : "",
    });
    setOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);
    setForm({
      first_name: s.first_name,
      last_name: s.last_name,
      student_code: s.student_code,
      class_id: s.class_id,
      status: s.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim())
      { toast.error("First and last name are required."); return; }
    if (!form.class_id) { toast.error("A student must belong to a class."); return; }
    const selectedClass = a.classes.find((klass) => klass.id === form.class_id);
    if (!selectedClass) { toast.error("Select a valid class."); return; }
    const studentCode = editing
      ? form.student_code
      : nextStudentCode(selectedClass.name, a.students);
    const values = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      student_code: editing ? studentCode : undefined,
      class_id: form.class_id,
      status: form.status,
    };
    if (editing) await update.mutateAsync({ id: editing.id, values });
    else await insert.mutateAsync(values);
    toast.success(editing ? "Student updated." : "Student added.");
    setOpen(false);
  };

  const deactivate = async (s: Student) => {
    await update.mutateAsync({ id: s.id, values: { status: "inactive" } });
    toast.success("Student deactivated. Their grade history is preserved.");
  };

  const del = async (s: Student) => {
    if (a.grades.some((g) => g.student_id === s.id)) {
      toast.error("This student has grade history. Deactivate instead of deleting.");
      return;
    }
    if (!window.confirm(`Permanently delete ${s.first_name} ${s.last_name}?`)) return;
    await remove.mutateAsync(s.id);
    toast.success("Student deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description="Keep the roster simple: name, ID, class and status."
        actions={
          <Button onClick={openNew} disabled={a.classes.length === 0}>
            <Plus className="size-4" /> Add student
          </Button>
        }
      />

      <FilterBar>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Search</Label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or student ID"
            className="w-[240px]"
          />
        </div>
        <FilterSelect
          label="Class"
          value={classFilter}
          onChange={setClassFilter}
          placeholder="All classes"
          options={a.classes.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All statuses"
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="No students match the current filters. Add a student to get started."
          action={
            a.classes.length ? <Button onClick={openNew}>Add student</Button> : undefined
          }
        />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    <Link
                      to="/students/$studentId"
                      params={{ studentId: s.id }}
                      className="inline-block hover:underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {s.first_name} {s.last_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.student_code}</TableCell>
                  <TableCell>{a.classes.find((c) => c.id === s.class_id)?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>
                      {titleCase(s.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="numeric text-right">
                    {a.studentAverage(s.id) === null ? "—" : `${a.studentAverage(s.id)}/${a.scale}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(s);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    {s.status === "active" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          void deactivate(s);
                        }}
                      >
                        Deactivate
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(event) => {
                        event.stopPropagation();
                        void del(s);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit student" : "Add student"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>First name</Label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Last name</Label>
              <Input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Student ID</Label>
              <Input
                value={form.student_code}
                readOnly={!editing}
                disabled={!editing}
                placeholder="Generated from class"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Class</Label>
              <Select
                value={form.class_id}
                onValueChange={(v) => {
                  const selectedClass = a.classes.find((klass) => klass.id === v);
                  setForm({
                    ...form,
                    class_id: v,
                    student_code:
                      selectedClass
                        ? nextStudentCode(selectedClass.name, a.students)
                        : form.student_code,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {a.classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
