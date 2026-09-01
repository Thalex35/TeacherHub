import { ClipboardList, Pencil, Table2, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ALL, FilterBar, FilterSelect } from "@/components/filters";
import { GradeEntryDialog } from "@/components/grade-entry-dialog";
import { PageHeader } from "@/components/page-header";
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
import { useInsert, useLessons, useRemove, useTopics, useUnits, useUpdate } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Assessment } from "@/lib/types";
import { useAcademics } from "@/lib/useAcademics";

const NONE = "__none__";

export function AssessmentsModule({
  mode,
  title,
  description,
}: {
  mode: "assignment" | "evaluation";
  title: string;
  description: string;
}) {
  const a = useAcademics();
  const units = useUnits();
  const topics = useTopics();
  const lessons = useLessons();
  const insert = useInsert("assessments");
  const update = useUpdate("assessments");
  const remove = useRemove("assessments");

  const assignmentType = a.types.find((t) => t.code === "assignment");
  const isAssignment = (x: Assessment) => x.evaluation_type_id === assignmentType?.id;
  const scoped = a.assessments.filter((x) =>
    mode === "assignment" ? isAssignment(x) : !isAssignment(x),
  );
  const typeOptions =
    mode === "assignment"
      ? a.types.filter((t) => t.code === "assignment")
      : a.types.filter((t) => t.code !== "assignment");

  const [classFilter, setClassFilter] = useState(ALL);
  const [periodFilter, setPeriodFilter] = useState(ALL);
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Assessment | null>(null);
  const [gradeTarget, setGradeTarget] = useState<Assessment | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    class_id: "",
    period_id: NONE,
    evaluation_type_id: "",
    unit_id: NONE,
    topic_id: NONE,
    lesson_id: NONE,
    date: new Date().toISOString().slice(0, 10),
    max_grade: "10",
    weight: "1",
    status: "planned",
  });

  const filtered = scoped.filter(
    (x) =>
      (classFilter === ALL || x.class_id === classFilter) &&
      (periodFilter === ALL || x.period_id === periodFilter) &&
      (typeFilter === ALL || x.evaluation_type_id === typeFilter),
  );

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      instructions: "",
      class_id: a.classes[0]?.id ?? "",
      period_id: a.periods.find((p) => p.is_current)?.id ?? NONE,
      evaluation_type_id: typeOptions[0]?.id ?? "",
      unit_id: NONE,
      topic_id: NONE,
      lesson_id: NONE,
      date: new Date().toISOString().slice(0, 10),
      max_grade: String(a.settings?.default_max_grade ?? 10),
      weight: "1",
      status: "planned",
    });
    setOpen(true);
  };

  const openEdit = (x: Assessment) => {
    setEditing(x);
    setForm({
      title: x.title,
      description: x.description ?? "",
      instructions: x.instructions ?? "",
      class_id: x.class_id,
      period_id: x.period_id ?? NONE,
      evaluation_type_id: x.evaluation_type_id,
      unit_id: x.unit_id ?? NONE,
      topic_id: x.topic_id ?? NONE,
      lesson_id: x.lesson_id ?? NONE,
      date: x.date,
      max_grade: String(x.max_grade),
      weight: String(x.weight),
      status: x.status,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("A title is required."); return; }
    if (!form.class_id) { toast.error("Select a class."); return; }
    if (!form.evaluation_type_id) { toast.error("Select an evaluation type."); return; }
    const max = Number(form.max_grade);
    if (!Number.isFinite(max) || max <= 0) { toast.error("Maximum grade must be greater than 0."); return; }
    const values = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      instructions: form.instructions.trim() || null,
      class_id: form.class_id,
      period_id: form.period_id === NONE ? null : form.period_id,
      evaluation_type_id: form.evaluation_type_id,
      unit_id: form.unit_id === NONE ? null : form.unit_id,
      topic_id: form.topic_id === NONE ? null : form.topic_id,
      lesson_id: form.lesson_id === NONE ? null : form.lesson_id,
      date: form.date,
      max_grade: max,
      weight: Number(form.weight) || 1,
      status: form.status,
    };
    if (editing) await update.mutateAsync({ id: editing.id, values });
    else await insert.mutateAsync(values);
    toast.success(editing ? "Saved." : "Created.");
    setOpen(false);
  };

  const del = async (x: Assessment) => {
    const graded = a.grades.filter((g) => g.assessment_id === x.id).length;
    if (
      !window.confirm(
        graded
          ? `"${x.title}" has ${graded} grade(s). Deleting removes them permanently. Continue?`
          : `Delete "${x.title}"?`,
      )
    )
      return;
    await remove.mutateAsync(x.id);
    toast.success("Deleted.");
  };

  const classUnits = (units.data ?? []).filter((u) => u.class_id === form.class_id);
  const unitTopics = (topics.data ?? []).filter((t) => t.unit_id === form.unit_id);
  const classLessons = (lessons.data ?? []).filter((l) => l.class_id === form.class_id);

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button onClick={openNew} disabled={!a.classes.length || !typeOptions.length}>
            <Plus className="size-4" /> New {mode === "assignment" ? "assignment" : "evaluation"}
          </Button>
        }
      />

      <FilterBar>
        <FilterSelect
          label="Class"
          value={classFilter}
          onChange={setClassFilter}
          placeholder="All classes"
          options={a.classes.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          label="Academic period"
          value={periodFilter}
          onChange={setPeriodFilter}
          placeholder="All periods"
          options={a.periods.map((p) => ({ value: p.id, label: p.name }))}
        />
        {mode === "evaluation" ? (
          <FilterSelect
            label="Type"
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All types"
            options={typeOptions.map((t) => ({ value: t.id, label: t.name }))}
          />
        ) : null}
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={
            mode === "assignment"
              ? "No assignments have been created yet"
              : "No evaluations have been created yet"
          }
          description={
            mode === "assignment"
              ? "Practical assignments are completed during class — usually the final 30 minutes of a lesson."
              : "Create a quiz, test, exam, project or practical evaluation to start grading."
          }
          action={
            a.classes.length ? (
              <Button onClick={openNew}>
                Create {mode === "assignment" ? "assignment" : "evaluation"}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Max</TableHead>
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((x) => (
                <TableRow key={x.id}>
                  <TableCell className="font-medium">{x.title}</TableCell>
                  <TableCell>{a.classes.find((c) => c.id === x.class_id)?.name}</TableCell>
                  <TableCell>{a.types.find((t) => t.id === x.evaluation_type_id)?.name}</TableCell>
                  <TableCell>{a.periods.find((p) => p.id === x.period_id)?.name ?? "—"}</TableCell>
                  <TableCell>{formatDate(x.date)}</TableCell>
                  <TableCell className="numeric text-right">{Number(x.max_grade)}</TableCell>
                  <TableCell className="numeric text-right">
                    {a.assessmentAverage(x.id) ?? "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="outline" size="sm" onClick={() => setGradeTarget(x)}>
                      <Table2 className="size-4" /> Grades
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(x)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => del(x)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <GradeEntryDialog
        assessment={gradeTarget}
        open={Boolean(gradeTarget)}
        onOpenChange={(v) => !v && setGradeTarget(null)}
        students={a.students.filter((s) => s.class_id === gradeTarget?.class_id)}
        grades={a.grades}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit" : "New"} {mode === "assignment" ? "assignment" : "evaluation"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Picker
                label="Class"
                value={form.class_id}
                onChange={(v) => setForm({ ...form, class_id: v, unit_id: NONE, topic_id: NONE, lesson_id: NONE })}
                options={a.classes.map((c) => ({ value: c.id, label: c.name }))}
              />
              <Picker
                label="Type"
                value={form.evaluation_type_id}
                onChange={(v) => setForm({ ...form, evaluation_type_id: v })}
                options={typeOptions.map((t) => ({ value: t.id, label: t.name }))}
              />
              <Picker
                label="Academic period"
                value={form.period_id}
                onChange={(v) => setForm({ ...form, period_id: v })}
                options={[
                  { value: NONE, label: "None" },
                  ...a.periods.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Picker
                label="Unit"
                value={form.unit_id}
                onChange={(v) => setForm({ ...form, unit_id: v, topic_id: NONE })}
                options={[
                  { value: NONE, label: "None" },
                  ...classUnits.map((u) => ({ value: u.id, label: u.title })),
                ]}
              />
              <Picker
                label="Topic"
                value={form.topic_id}
                onChange={(v) => setForm({ ...form, topic_id: v })}
                options={[
                  { value: NONE, label: "None" },
                  ...unitTopics.map((t) => ({ value: t.id, label: t.title })),
                ]}
              />
              <Picker
                label="Lesson"
                value={form.lesson_id}
                onChange={(v) => setForm({ ...form, lesson_id: v })}
                options={[
                  { value: NONE, label: "None" },
                  ...classLessons.map((l) => ({ value: l.id, label: l.title })),
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Maximum grade</Label>
                <Input
                  inputMode="decimal"
                  value={form.max_grade}
                  onChange={(e) => setForm({ ...form, max_grade: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Weight</Label>
                <Input
                  inputMode="decimal"
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                />
              </div>
              <Picker
                label="Status"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                options={[
                  { value: "planned", label: "Planned" },
                  { value: "graded", label: "Graded" },
                  { value: "archived", label: "Archived" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Instructions</Label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                rows={2}
              />
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

function Picker({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
