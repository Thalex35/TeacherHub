import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInsert, useRemove, useSubjects, useUpdate, useYears } from "@/lib/data";
import { useAcademics } from "@/lib/useAcademics";
import type { Klass } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({
    meta: [
      { title: "Classes — TeacherHub" },
      { name: "description", content: "Create and manage your classes, sections and averages." },
      { property: "og:title", content: "Classes — TeacherHub" },
      { property: "og:description", content: "Manage classes across academic years and subjects." },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  const a = useAcademics();
  const subjects = useSubjects();
  const years = useYears();
  const insert = useInsert("classes");
  const update = useUpdate("classes");
  const remove = useRemove("classes");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Klass | null>(null);
  const [form, setForm] = useState({
    name: "",
    section: "",
    subject_id: "",
    academic_year_id: "",
    is_active: true,
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      section: "",
      subject_id: subjects.data?.[0]?.id ?? "",
      academic_year_id: years.data?.find((y) => y.is_current)?.id ?? years.data?.[0]?.id ?? "",
      is_active: true,
    });
    setOpen(true);
  };

  const openEdit = (c: Klass) => {
    setEditing(c);
    setForm({
      name: c.name,
      section: c.section ?? "",
      subject_id: c.subject_id,
      academic_year_id: c.academic_year_id,
      is_active: c.is_active,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast.error("Class name is required."); return; }
    if (!form.subject_id || !form.academic_year_id)
      { toast.error("Subject and academic year are required."); return; }
    const values = {
      name: form.name.trim(),
      section: form.section.trim() || null,
      subject_id: form.subject_id,
      academic_year_id: form.academic_year_id,
      is_active: form.is_active,
    };
    if (editing) await update.mutateAsync({ id: editing.id, values });
    else await insert.mutateAsync({ ...values, sort_order: a.classes.length + 1 });
    toast.success(editing ? "Class updated." : "Class created.");
    setOpen(false);
  };

  const del = async (c: Klass) => {
    if (a.students.some((s) => s.class_id === c.id)) {
      toast.error("This class still has students. Deactivate it instead to keep its history.");
      return;
    }
    if (!window.confirm(`Delete class ${c.name}? This cannot be undone.`)) return;
    await remove.mutateAsync(c.id);
    toast.success("Class deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Classes"
        description="Every class belongs to an academic year and a subject."
        actions={
          <Button onClick={openNew}>
            <Plus className="size-4" /> Add class
          </Button>
        }
      />

      {a.classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No classes yet"
          description="Create your first class to start adding students and curriculum."
          action={<Button onClick={openNew}>Create class</Button>}
        />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Academic year</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {a.classes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link
                      to="/classes/$classId"
                      params={{ classId: c.id }}
                      className="hover:underline"
                    >
                      {c.name}
                      {c.section ? ` · ${c.section}` : ""}
                    </Link>
                  </TableCell>
                  <TableCell>{subjects.data?.find((s) => s.id === c.subject_id)?.name}</TableCell>
                  <TableCell>{years.data?.find((y) => y.id === c.academic_year_id)?.name}</TableCell>
                  <TableCell className="numeric text-right">
                    {a.students.filter((s) => s.class_id === c.id && s.status === "active").length}
                  </TableCell>
                  <TableCell className="numeric text-right">
                    {a.classAverage(c.id) === null ? "—" : `${a.classAverage(c.id)}/${a.scale}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => del(c)}>
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
            <DialogTitle>{editing ? "Edit class" : "New class"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Class name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="NS1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Section (optional)</Label>
                <Input
                  value={form.section}
                  onChange={(e) => setForm({ ...form, section: e.target.value })}
                  placeholder="A"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Select
                  value={form.subject_id}
                  onValueChange={(v) => setForm({ ...form, subject_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {(subjects.data ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Academic year</Label>
                <Select
                  value={form.academic_year_id}
                  onValueChange={(v) => setForm({ ...form, academic_year_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {(years.data ?? []).map((y) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Active</Label>
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
