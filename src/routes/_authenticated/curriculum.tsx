import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, ChevronDown, ChevronUp, FileUp, Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { FilterBar } from "@/components/filters";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CurriculumImportDialog,
  type CurriculumImportSummary,
} from "@/components/curriculum-import-dialog";
import type { CurriculumImportRow } from "@/lib/curriculum-import";
import {
  useClasses,
  useInsert,
  useLessons,
  useRemove,
  useTopics,
  useUnits,
  useUpdate,
} from "@/lib/data";
import { titleCase } from "@/lib/format";
import type { Lesson, Topic, Unit } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/curriculum")({
  head: () => ({
    meta: [
      { title: "Curriculum — TeacherHub" },
      {
        name: "description",
        content: "Build reusable units, topics and lessons for every class and academic year.",
      },
      { property: "og:title", content: "Curriculum — TeacherHub" },
      { property: "og:description", content: "Reusable curriculum structure per class." },
    ],
  }),
  component: CurriculumPage,
});

type Editing =
  | { kind: "unit"; row: Unit | null }
  | { kind: "topic"; row: Topic | null; unitId: string }
  | { kind: "lesson"; row: Lesson | null; unitId: string; topicId: string | null }
  | null;

function CurriculumPage() {
  const classes = useClasses();
  const units = useUnits();
  const topics = useTopics();
  const lessons = useLessons();

  const insertUnit = useInsert("units");
  const updateUnit = useUpdate("units");
  const removeUnit = useRemove("units");
  const insertTopic = useInsert("topics");
  const updateTopic = useUpdate("topics");
  const removeTopic = useRemove("topics");
  const insertLesson = useInsert("lessons");
  const updateLesson = useUpdate("lessons");
  const removeLesson = useRemove("lessons");

  const [classId, setClassId] = useState<string>("");
  const [importOpen, setImportOpen] = useState(false);
  const activeClassId = classId || classes.data?.[0]?.id || "";
  const [editing, setEditing] = useState<Editing>(null);
  const [collapsedUnits, setCollapsedUnits] = useState<Record<string, boolean>>({});
  const [collapsedTopics, setCollapsedTopics] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<{
    title?: string;
    description?: string;
    objectives?: string;
    theory?: string;
    practical?: string;
    assignment_section?: string;
    notes?: string;
    estimated_minutes?: string;
    status?: string;
  }>({});

  const classUnits = (units.data ?? []).filter((u) => u.class_id === activeClassId);
  const classLessons = (lessons.data ?? []).filter((l) => l.class_id === activeClassId);
  const completed = classLessons.filter((l) => l.status === "completed").length;
  const progress = classLessons.length ? (completed / classLessons.length) * 100 : 0;

  const openEditor = (e: Editing) => {
    setEditing(e);
    if (!e) return;
    if (e.kind === "unit")
      setForm({ title: e.row?.title ?? "", description: e.row?.description ?? "" });
    if (e.kind === "topic")
      setForm({ title: e.row?.title ?? "", description: e.row?.description ?? "" });
    if (e.kind === "lesson")
      setForm({
        title: e.row?.title ?? "",
        description: e.row?.description ?? "",
        objectives: e.row?.objectives ?? "",
        theory: e.row?.theory ?? "",
        practical: e.row?.practical ?? "",
        assignment_section: e.row?.assignment_section ?? "",
        notes: e.row?.notes ?? "",
        estimated_minutes: String(e.row?.estimated_minutes ?? 120),
        status: e.row?.status ?? "planned",
      });
  };

  const save = async () => {
    if (!editing) return;
    if (!form.title?.trim()) {
      toast.error("A title is required.");
      return;
    }
    if (editing.kind === "unit") {
      const values = { title: form.title.trim(), description: form.description || null };
      if (editing.row) await updateUnit.mutateAsync({ id: editing.row.id, values });
      else
        await insertUnit.mutateAsync({
          ...values,
          class_id: activeClassId,
          position: classUnits.length + 1,
        });
    } else if (editing.kind === "topic") {
      const values = { title: form.title.trim(), description: form.description || null };
      if (editing.row) await updateTopic.mutateAsync({ id: editing.row.id, values });
      else
        await insertTopic.mutateAsync({
          ...values,
          unit_id: editing.unitId,
          position: (topics.data ?? []).filter((t) => t.unit_id === editing.unitId).length + 1,
        });
    } else {
      const values = {
        title: form.title.trim(),
        description: form.description || null,
        objectives: form.objectives || null,
        theory: form.theory || null,
        practical: form.practical || null,
        assignment_section: form.assignment_section || null,
        notes: form.notes || null,
        estimated_minutes: Number(form.estimated_minutes) || 120,
        status: form.status || "planned",
      };
      if (editing.row) await updateLesson.mutateAsync({ id: editing.row.id, values });
      else
        await insertLesson.mutateAsync({
          ...values,
          class_id: activeClassId,
          unit_id: editing.unitId,
          topic_id: editing.topicId,
          position: classLessons.length + 1,
        });
    }
    toast.success("Saved.");
    setEditing(null);
  };

  const move = async (lesson: Lesson, direction: -1 | 1) => {
    const siblings = classLessons
      .filter((l) => l.topic_id === lesson.topic_id)
      .sort((x, y) => x.position - y.position);
    const idx = siblings.findIndex((l) => l.id === lesson.id);
    const target = siblings[idx + direction];
    if (!target) return;
    await updateLesson.mutateAsync({ id: lesson.id, values: { position: target.position } });
    await updateLesson.mutateAsync({ id: target.id, values: { position: lesson.position } });
  };

  const toggleComplete = async (lesson: Lesson) => {
    await updateLesson.mutateAsync({
      id: lesson.id,
      values: { status: lesson.status === "completed" ? "planned" : "completed" },
    });
  };

  const importCurriculum = async (
    rows: CurriculumImportRow[],
  ): Promise<CurriculumImportSummary> => {
    const unitByKey = new Map(
      (units.data ?? [])
        .filter((unit) => unit.class_id === activeClassId)
        .map((unit) => [`${unit.class_id}\u0000${unit.title.trim().toLocaleLowerCase()}`, unit]),
    );
    const topicByKey = new Map(
      (topics.data ?? []).map((topic) => [
        `${topic.unit_id}\u0000${topic.title.trim().toLocaleLowerCase()}`,
        topic,
      ]),
    );
    const lessonByKey = new Map(
      (lessons.data ?? []).map((lesson) => [
        `${lesson.unit_id ?? ""}\u0000${lesson.topic_id ?? ""}\u0000${lesson.title.trim().toLocaleLowerCase()}`,
        lesson,
      ]),
    );
    let nextUnitPosition = Math.max(0, ...classUnits.map((unit) => unit.position)) + 1;
    const nextTopicPosition = new Map<string, number>();
    const nextLessonPosition = new Map<string, number>();
    for (const topic of topics.data ?? []) {
      nextTopicPosition.set(
        topic.unit_id,
        Math.max(nextTopicPosition.get(topic.unit_id) ?? 0, topic.position),
      );
    }
    for (const lesson of classLessons) {
      const scope = lesson.topic_id ?? lesson.unit_id ?? "";
      nextLessonPosition.set(scope, Math.max(nextLessonPosition.get(scope) ?? 0, lesson.position));
    }

    let unitCount = 0;
    let topicCount = 0;
    let lessonCount = 0;
    let skipped = 0;
    const errors: CurriculumImportSummary["errors"] = [];
    const countedUnits = new Set<string>();
    const countedTopics = new Set<string>();

    for (const row of rows) {
      try {
        const unitKey = `${activeClassId}\u0000${row.unit.trim().toLocaleLowerCase()}`;
        let unit = unitByKey.get(unitKey);
        if (!unit) {
          unit = (await insertUnit.mutateAsync({
            class_id: activeClassId,
            title: row.unit,
            description: null,
            position: nextUnitPosition++,
          })) as Unit;
          unitByKey.set(unitKey, unit);
        }
        if (!countedUnits.has(unit.id)) {
          countedUnits.add(unit.id);
          unitCount += 1;
        }

        const topicKey = `${unit.id}\u0000${row.topic.trim().toLocaleLowerCase()}`;
        let topic = topicByKey.get(topicKey);
        if (!topic) {
          const position = (nextTopicPosition.get(unit.id) ?? 0) + 1;
          topic = (await insertTopic.mutateAsync({
            unit_id: unit.id,
            title: row.topic,
            description: null,
            position,
          })) as Topic;
          topicByKey.set(topicKey, topic);
          nextTopicPosition.set(unit.id, position);
        }
        if (!countedTopics.has(topic.id)) {
          countedTopics.add(topic.id);
          topicCount += 1;
        }

        const lessonKey = `${unit.id}\u0000${topic.id}\u0000${row.lesson.trim().toLocaleLowerCase()}`;
        if (lessonByKey.has(lessonKey)) {
          skipped += 1;
          continue;
        }
        const scope = topic.id;
        const position = (nextLessonPosition.get(scope) ?? 0) + 1;
        const lesson = (await insertLesson.mutateAsync({
          class_id: activeClassId,
          unit_id: unit.id,
          topic_id: topic.id,
          title: row.lesson,
          description: row.description || null,
          assignment_section: row.assignment || null,
          position,
          estimated_minutes: 120,
          status: "planned",
        })) as Lesson;
        lessonByKey.set(lessonKey, lesson);
        nextLessonPosition.set(scope, position);
        lessonCount += 1;
      } catch {
        errors.push({ rowNumber: row.rowNumber, error: "Could not save this curriculum row." });
      }
    }

    if (lessonCount)
      toast.success(`${lessonCount} lesson${lessonCount === 1 ? "" : "s"} imported.`);
    return { units: unitCount, topics: topicCount, lessons: lessonCount, skipped, errors };
  };

  const confirmDelete = async (label: string, fn: () => Promise<unknown>) => {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    await fn();
    toast.success("Deleted.");
  };

  return (
    <div>
      <PageHeader
        title="Curriculum"
        description="Academic year → subject → class → unit → topic → lesson. Reuse it every year."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)} disabled={!activeClassId}>
              <FileUp className="size-4" /> Import curriculum
            </Button>
            <Button
              onClick={() => openEditor({ kind: "unit", row: null })}
              disabled={!activeClassId}
            >
              <Plus className="size-4" /> Add unit
            </Button>
          </div>
        }
      />

      <FilterBar>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Class</Label>
          <Select value={activeClassId} onValueChange={setClassId}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select class" />
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
        <div className="min-w-0 flex-1 space-y-1.5 sm:min-w-[220px]">
          <Label className="text-xs text-muted-foreground">
            Progress — {completed}/{classLessons.length} lessons completed
          </Label>
          <Progress value={progress} />
        </div>
      </FilterBar>

      {classUnits.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No curriculum for this class yet"
          description="Start by creating a unit, then add topics and lessons inside it."
          action={
            <Button
              onClick={() => openEditor({ kind: "unit", row: null })}
              disabled={!activeClassId}
            >
              Create unit
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {classUnits.map((u) => {
            const unitTopics = (topics.data ?? []).filter((t) => t.unit_id === u.id);
            const unitLessons = classLessons.filter((lesson) => lesson.unit_id === u.id);
            const unitCompleted = unitLessons.filter(
              (lesson) => lesson.status === "completed",
            ).length;
            const unitCollapsed = collapsedUnits[u.id] ?? true;
            return (
              <div key={u.id} className="surface overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 p-4">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    onClick={() => setCollapsedUnits({ ...collapsedUnits, [u.id]: !unitCollapsed })}
                    aria-expanded={!unitCollapsed}
                  >
                    <ChevronDown
                      className={`mt-1 size-5 shrink-0 text-primary transition-transform ${unitCollapsed ? "-rotate-90" : ""}`}
                    />
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-lg font-semibold">{u.title}</span>
                        <Badge variant="outline">{unitTopics.length} topics</Badge>
                        <Badge variant="secondary">
                          {unitCompleted}/{unitLessons.length} lessons
                        </Badge>
                      </span>
                      {u.description ? (
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {u.description}
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditor({ kind: "topic", row: null, unitId: u.id })}
                    >
                      <Plus className="size-4" /> Topic
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditor({ kind: "unit", row: u })}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        confirmDelete(`unit "${u.title}"`, () => removeUnit.mutateAsync(u.id))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                {!unitCollapsed && unitTopics.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">No topics in this unit yet.</p>
                ) : null}

                {!unitCollapsed ? (
                  <div className="space-y-3 p-4">
                    {unitTopics.map((t) => {
                      const topicLessons = classLessons
                        .filter((l) => l.topic_id === t.id)
                        .sort((x, y) => x.position - y.position);
                      const topicCollapsed = collapsedTopics[t.id] ?? true;
                      return (
                        <div
                          key={t.id}
                          className="rounded-lg border border-border bg-background/70"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 p-3 text-left"
                              onClick={() =>
                                setCollapsedTopics({ ...collapsedTopics, [t.id]: !topicCollapsed })
                              }
                              aria-expanded={!topicCollapsed}
                            >
                              <ChevronDown
                                className={`size-4 shrink-0 text-muted-foreground transition-transform ${topicCollapsed ? "-rotate-90" : ""}`}
                              />
                              <span className="min-w-0 truncate font-medium">{t.title}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {topicLessons.length}{" "}
                                {topicLessons.length === 1 ? "lesson" : "lessons"}
                              </span>
                            </button>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  openEditor({
                                    kind: "lesson",
                                    row: null,
                                    unitId: u.id,
                                    topicId: t.id,
                                  })
                                }
                              >
                                <Plus className="size-4" /> Lesson
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditor({ kind: "topic", row: t, unitId: u.id })}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  confirmDelete(`topic "${t.title}"`, () =>
                                    removeTopic.mutateAsync(t.id),
                                  )
                                }
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>

                          {!topicCollapsed && topicLessons.length === 0 ? (
                            <p className="px-3 pb-3 pt-2 text-sm text-muted-foreground">
                              No lessons for this topic yet.
                            </p>
                          ) : !topicCollapsed ? (
                            <ul className="mt-2 divide-y divide-border px-3">
                              {topicLessons.map((l, i) => (
                                <li key={l.id} className="flex flex-wrap items-center gap-2 py-2">
                                  <span className="flex-1 text-sm">{l.title}</span>
                                  <Badge
                                    variant={l.status === "completed" ? "default" : "secondary"}
                                  >
                                    {titleCase(l.status)}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={i === 0}
                                    onClick={() => move(l, -1)}
                                  >
                                    <ChevronUp className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={i === topicLessons.length - 1}
                                    onClick={() => move(l, 1)}
                                  >
                                    <ChevronDown className="size-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleComplete(l)}
                                  >
                                    {l.status === "completed" ? "Reopen" : "Complete"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      openEditor({
                                        kind: "lesson",
                                        row: l,
                                        unitId: u.id,
                                        topicId: t.id,
                                      })
                                    }
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      confirmDelete(`lesson "${l.title}"`, () =>
                                        removeLesson.mutateAsync(l.id),
                                      )
                                    }
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.row ? "Edit" : "New"} {editing?.kind}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title ?? ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {editing?.kind === "lesson" ? (
              <>
                <div className="space-y-1.5">
                  <Label>Learning objectives</Label>
                  <Textarea
                    rows={2}
                    value={form.objectives ?? ""}
                    onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Theory section</Label>
                    <Textarea
                      rows={3}
                      value={form.theory ?? ""}
                      onChange={(e) => setForm({ ...form, theory: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Practical activity</Label>
                    <Textarea
                      rows={3}
                      value={form.practical ?? ""}
                      onChange={(e) => setForm({ ...form, practical: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Assignment section</Label>
                    <Textarea
                      rows={2}
                      value={form.assignment_section ?? ""}
                      onChange={(e) => setForm({ ...form, assignment_section: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea
                      rows={2}
                      value={form.notes ?? ""}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Estimated duration (minutes)</Label>
                    <Input
                      inputMode="numeric"
                      value={form.estimated_minutes ?? "120"}
                      onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={form.status ?? "planned"}
                      onValueChange={(v) => setForm({ ...form, status: v })}
                    >
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
                  </div>
                </div>
              </>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CurriculumImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        units={(units.data ?? []).filter((unit) => unit.class_id === activeClassId)}
        topics={(topics.data ?? []).filter((topic) =>
          (units.data ?? []).some(
            (unit) => unit.id === topic.unit_id && unit.class_id === activeClassId,
          ),
        )}
        lessons={classLessons}
        onImport={importCurriculum}
      />
    </div>
  );
}
