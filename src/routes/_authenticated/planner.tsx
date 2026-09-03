import { createFileRoute } from "@tanstack/react-router";
import { NotebookPen, Pencil, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useClasses,
  useInsert,
  useLessons,
  useSubjects,
  useTopics,
  useUnits,
  useUpdate,
} from "@/lib/data";
import { formatDate, titleCase } from "@/lib/format";
import type { Lesson } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({
    meta: [
      { title: "Lesson Planner — TeacherHub" },
      {
        name: "description",
        content: "Plan two-hour sessions with configurable theory, demonstration and practice blocks.",
      },
      { property: "og:title", content: "Lesson Planner — TeacherHub" },
      { property: "og:description", content: "Plan and track every teaching session." },
    ],
  }),
  component: PlannerPage,
});

const NONE = "__none__";

function PlannerPage() {
  const classes = useClasses();
  const subjects = useSubjects();
  const units = useUnits();
  const topics = useTopics();
  const lessons = useLessons();
  const insert = useInsert("lessons");
  const update = useUpdate("lessons");

  const [classFilter, setClassFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [form, setForm] = useState({
    title: "",
    class_id: "",
    unit_id: NONE,
    topic_id: NONE,
    planned_date: new Date().toISOString().slice(0, 10),
    objectives: "",
    notes: "",
    theory_minutes: "30",
    demo_minutes: "30",
    assignment_minutes: "30",
    review_minutes: "30",
    status: "planned",
  });

  const rows = (lessons.data ?? [])
    .filter(
      (l) =>
        (classFilter === ALL || l.class_id === classFilter) &&
        (statusFilter === ALL || l.status === statusFilter),
    )
    .sort((a, b) => (a.planned_date ?? "").localeCompare(b.planned_date ?? ""));

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "",
      class_id: classes.data?.[0]?.id ?? "",
      unit_id: NONE,
      topic_id: NONE,
      planned_date: new Date().toISOString().slice(0, 10),
      objectives: "",
      notes: "",
      theory_minutes: "30",
      demo_minutes: "30",
      assignment_minutes: "30",
      review_minutes: "30",
      status: "planned",
    });
    setOpen(true);
  };

  const openEdit = (l: Lesson) => {
    setEditing(l);
    setForm({
      title: l.title,
      class_id: l.class_id,
      unit_id: l.unit_id ?? NONE,
      topic_id: l.topic_id ?? NONE,
      planned_date: l.planned_date ?? new Date().toISOString().slice(0, 10),
      objectives: l.objectives ?? "",
      notes: l.notes ?? "",
      theory_minutes: String(l.theory_minutes),
      demo_minutes: String(l.demo_minutes),
      assignment_minutes: String(l.assignment_minutes),
      review_minutes: String(l.review_minutes),
      status: l.status,
    });
    setOpen(true);
  };

  const total =
    Number(form.theory_minutes || 0) +
    Number(form.demo_minutes || 0) +
    Number(form.assignment_minutes || 0) +
    Number(form.review_minutes || 0);

  const save = async () => {
    if (!form.title.trim()) { toast.error("A lesson title is required."); return; }
    if (!form.class_id) { toast.error("Select a class."); return; }
    const values = {
      title: form.title.trim(),
      class_id: form.class_id,
      unit_id: form.unit_id === NONE ? null : form.unit_id,
      topic_id: form.topic_id === NONE ? null : form.topic_id,
      planned_date: form.planned_date || null,
      objectives: form.objectives || null,
      notes: form.notes || null,
      theory_minutes: Number(form.theory_minutes) || 0,
      demo_minutes: Number(form.demo_minutes) || 0,
      assignment_minutes: Number(form.assignment_minutes) || 0,
      review_minutes: Number(form.review_minutes) || 0,
      estimated_minutes: total,
      status: form.status,
    };
    if (editing) await update.mutateAsync({ id: editing.id, values });
    else await insert.mutateAsync({ ...values, position: (lessons.data ?? []).length + 1 });
    toast.success("Lesson plan saved.");
    setOpen(false);
  };

  const setStatus = async (l: Lesson, status: string) => {
    await update.mutateAsync({ id: l.id, values: { status } });
  };

  const formUnits = (units.data ?? []).filter((u) => u.class_id === form.class_id);
  const formTopics = (topics.data ?? []).filter((t) => t.unit_id === form.unit_id);

  return (
    <div>
      <PageHeader
        title="Lesson Planner"
        description="A configurable two-hour structure: theory, demonstration, practical assignment and review."
        actions={
          <Button onClick={openNew} disabled={!classes.data?.length}>
            <Plus className="size-4" /> Plan lesson
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect
          label="Class"
          value={classFilter}
          onChange={setClassFilter}
          placeholder="All classes"
          options={(classes.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All statuses"
          options={["planned", "in_progress", "completed", "skipped"].map((s) => ({
            value: s,
            label: titleCase(s),
          }))}
        />
      </FilterBar>

      {rows.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No lesson plans yet"
          description="Plan your next session to keep theory, demonstration and practice on schedule."
          action={
            classes.data?.length ? <Button onClick={openNew}>Plan a lesson</Button> : undefined
          }
        />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Lesson</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Structure</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{formatDate(l.planned_date)}</TableCell>
                  <TableCell className="font-medium">{l.title}</TableCell>
                  <TableCell>{classes.data?.find((c) => c.id === l.class_id)?.name}</TableCell>
                  <TableCell className="numeric text-sm text-muted-foreground">
                    {l.theory_minutes}/{l.demo_minutes}/{l.assignment_minutes}/{l.review_minutes} min
                  </TableCell>
                  <TableCell>
                    <Select value={l.status} onValueChange={(v) => setStatus(l, v)}>
                      <SelectTrigger className="h-8 w-full sm:w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["planned", "in_progress", "completed", "skipped"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {titleCase(s)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(l)}>
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit lesson plan" : "New lesson plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Lesson title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.planned_date}
                  onChange={(e) => setForm({ ...form, planned_date: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Select
                  value={form.class_id}
                  onValueChange={(v) => setForm({ ...form, class_id: v, unit_id: NONE, topic_id: NONE })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Class" />
                  </SelectTrigger>
                  <SelectContent>
                    {(classes.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input
                  readOnly
                  value={
                    subjects.data?.find(
                      (s) => s.id === classes.data?.find((c) => c.id === form.class_id)?.subject_id,
                    )?.name ?? ""
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Unit</Label>
                <Select
                  value={form.unit_id}
                  onValueChange={(v) => setForm({ ...form, unit_id: v, topic_id: NONE })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {formUnits.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Topic</Label>
                <Select
                  value={form.topic_id}
                  onValueChange={(v) => setForm({ ...form, topic_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {formTopics.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Learning objectives</Label>
              <Textarea
                rows={2}
                value={form.objectives}
                onChange={(e) => setForm({ ...form, objectives: e.target.value })}
              />
            </div>
            <div>
              <Label className="mb-2 block">Session structure (minutes) — total {total} min</Label>
              <div className="grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ["theory_minutes", "Theory"],
                    ["demo_minutes", "Demonstration"],
                    ["assignment_minutes", "Assignment"],
                    ["review_minutes", "Correction"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    <Input
                      inputMode="numeric"
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Teacher notes</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["planned", "in_progress", "completed", "skipped"].map((s) => (
                      <SelectItem key={s} value={s}>
                        {titleCase(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Badge variant="secondary" className="mt-2">
                  {titleCase(form.status)}
                </Badge>
              </div>
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
