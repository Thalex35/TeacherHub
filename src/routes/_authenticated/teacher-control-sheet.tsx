import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, PencilLine, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { FilterBar, FilterSelect } from "@/components/filters";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useClasses, useSettings, useSubjects, useTeachers, useUnits } from "@/lib/data";
import {
  exportTeacherControlSheetPdf,
  type TeacherControlSessionPdfEntry,
} from "@/lib/teacher-control-sheet-export";

type TeacherControlSession = {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  month: string;
  week_number: number;
  session_date: string;
  entry_time: string;
  exit_time: string;
  theme: string;
  objectives: string;
  devoir_title: string;
  devoir_date: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

type SessionDraft = {
  week_number: number;
  session_date: string;
  entry_time: string;
  exit_time: string;
  theme: string;
  objectives: string;
  devoir_title: string;
  devoir_date: string;
  remarks: string;
};

const emptyDraft = (): SessionDraft => ({
  week_number: 1,
  session_date: new Date().toISOString().slice(0, 10),
  entry_time: "08:00",
  exit_time: "09:00",
  theme: "",
  objectives: "",
  devoir_title: "",
  devoir_date: "",
  remarks: "",
});

export const Route = createFileRoute("/_authenticated/teacher-control-sheet")({
  head: () => ({
    meta: [
      { title: "Teacher control sheet — TeacherHub" },
      {
        name: "description",
        content: "Track, edit and export the official teacher control sheet by class and subject.",
      },
      { property: "og:title", content: "Teacher control sheet — TeacherHub" },
      { property: "og:description", content: "Official monthly teacher control sheet." },
    ],
  }),
  component: TeacherControlSheetPage,
});

function TeacherControlSheetPage() {
  const teachersQuery = useTeachers();
  const classesQuery = useClasses();
  const subjectsQuery = useSubjects();
  const unitsQuery = useUnits();
  const settingsQuery = useSettings();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [monthValue, setMonthValue] = useState(new Date().toISOString().slice(0, 7));
  const [draft, setDraft] = useState<SessionDraft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  const teacherOptions = useMemo(
    () =>
      (teachersQuery.data ?? []).map((teacher) => ({
        value: teacher.id,
        label: teacher.full_name,
      })),
    [teachersQuery.data],
  );

  useEffect(() => {
    if (!teacherId && teacherOptions.length) {
      const selectedTeacher =
        teacherOptions.find((option) => {
          const teacher = (teachersQuery.data ?? []).find((item) => item.id === option.value);
          return teacher?.user_id === currentUserId;
        }) ?? teacherOptions[0];
      if (selectedTeacher) setTeacherId(selectedTeacher.value);
    }
  }, [currentUserId, teacherId, teacherOptions, teachersQuery.data]);

  const selectedTeacher = (teachersQuery.data ?? []).find((item) => item.id === teacherId);
  const availableClasses = useMemo(
    () =>
      (classesQuery.data ?? []).filter((klass) => {
        const subject = (subjectsQuery.data ?? []).find((item) => item.id === klass.subject_id);
        return (
          (!klass.teacher_id || klass.teacher_id === teacherId) &&
          (!subject?.teacher_id || subject.teacher_id === teacherId)
        );
      }),
    [classesQuery.data, subjectsQuery.data, teacherId],
  );
  const selectedClass = availableClasses.find((item) => item.id === classId);
  const selectedSubject = (subjectsQuery.data ?? []).find((item) => item.id === subjectId);

  useEffect(() => {
    if (!availableClasses.some((klass) => klass.id === classId)) {
      setClassId(availableClasses[0]?.id ?? "");
    }
  }, [availableClasses, classId]);

  useEffect(() => {
    if (!classId) {
      setSubjectId("");
      return;
    }
    const klass = availableClasses.find((item) => item.id === classId);
    if (!klass) return;
    if (subjectId !== klass.subject_id) setSubjectId(klass.subject_id);
  }, [availableClasses, classId, subjectId]);

  const {
    data: sessions = [],
    error: sessionsError,
    isError: sessionsFailed,
    isFetching: sessionsLoading,
    refetch,
  } = useQuery({
    queryKey: ["teacher-control-sessions", teacherId, classId, subjectId, monthValue],
    queryFn: async () => {
      if (!teacherId || !classId || !subjectId || !monthValue) return [] as TeacherControlSession[];
      const { data, error } = await supabase
        .from("teacher_control_sessions" as never)
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("class_id", classId)
        .eq("subject_id", subjectId)
        .eq("month", monthValue)
        .order("session_date", { ascending: true })
        .order("entry_time", { ascending: true });
      if (error) {
        if (
          error.code === "PGRST205" ||
          error.message
            .toLowerCase()
            .includes(
              "could not find the table 'public.teacher_control_sessions' in the schema cache",
            )
        ) {
          throw new Error(
            "The teacher control sessions table is not configured. Ask a Supabase project administrator to apply migration 20261019160000_teacher_control_sessions.sql.",
          );
        }
        throw new Error(error.message);
      }
      return (data ?? []) as TeacherControlSession[];
    },
    enabled: Boolean(teacherId && classId && subjectId && monthValue),
  });

  const unitSuggestions = useMemo(
    () => (unitsQuery.data ?? []).filter((unit) => unit.class_id === classId && unit.is_active),
    [classId, unitsQuery.data],
  );

  const sortedSessions = [...sessions].sort(
    (a, b) =>
      a.session_date.localeCompare(b.session_date) || a.entry_time.localeCompare(b.entry_time),
  );

  const completionState =
    sortedSessions.length === 0
      ? "Not started"
      : sortedSessions.length >= 5
        ? "Completed"
        : "In progress";

  const resetDraft = () => {
    setDraft(emptyDraft());
    setEditingId(null);
  };

  const handleFieldChange = (field: keyof SessionDraft, value: string | number) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const onUnitSuggestion = (value: string) => {
    const unit = unitSuggestions.find((item) => item.id === value);
    if (!unit) return;
    setDraft((current) => ({
      ...current,
      theme: unit.title,
      objectives: unit.description ?? current.objectives,
    }));
  };

  const saveSession = async () => {
    if (!teacherId || !classId || !subjectId || !monthValue) {
      toast.error("Choose a teacher, class, subject and month before saving.");
      return;
    }

    if (
      !draft.session_date ||
      !draft.entry_time ||
      !draft.exit_time ||
      !draft.theme.trim() ||
      !draft.objectives.trim()
    ) {
      toast.error("Complete the required session fields before saving.");
      return;
    }
    if (!draft.session_date.startsWith(`${monthValue}-`)) {
      toast.error("The session date must be within the selected month.");
      return;
    }
    if (draft.exit_time <= draft.entry_time) {
      toast.error("The exit time must be later than the entry time.");
      return;
    }

    const payload = {
      id: editingId ?? undefined,
      teacher_id: teacherId,
      class_id: classId,
      subject_id: subjectId,
      month: monthValue,
      week_number: Number(draft.week_number) || 1,
      session_date: draft.session_date,
      entry_time: draft.entry_time,
      exit_time: draft.exit_time,
      theme: draft.theme.trim(),
      objectives: draft.objectives.trim(),
      devoir_title: draft.devoir_title.trim(),
      devoir_date: draft.devoir_date || null,
      remarks: draft.remarks.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("teacher_control_sessions" as never)
          .update(payload as never)
          .eq("id", editingId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("teacher_control_sessions" as never)
          .insert(payload as never);
        if (error) throw new Error(error.message);
      }
      await refetch();
      resetDraft();
      toast.success(editingId ? "Session updated." : "Session saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the session.");
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (id: string) => {
    try {
      const { error } = await supabase
        .from("teacher_control_sessions" as never)
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
      await refetch();
      if (editingId === id) resetDraft();
      toast.success("Session deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete the session.");
    }
  };

  const exportPdf = async () => {
    if (!selectedTeacher || !selectedClass || !selectedSubject) {
      toast.error("Select a teacher, class and subject before exporting.");
      return;
    }
    if (settingsQuery.isLoading) {
      toast.error("Wait for the teacher name in Settings to finish loading.");
      return;
    }
    if (settingsQuery.isError) {
      toast.error(settingsQuery.error.message);
      return;
    }
    const teacherName = settingsQuery.data?.teacher_name.trim();
    if (!teacherName) {
      toast.error("Enter the teacher name in Settings before exporting.");
      return;
    }
    if (sessionsFailed) {
      toast.error(
        "Saved sessions could not be loaded. Resolve the loading error before exporting.",
      );
      return;
    }
    if (sessionsLoading) {
      toast.error("Wait for the saved sessions to finish loading before exporting.");
      return;
    }

    const sessionsForPdf: TeacherControlSessionPdfEntry[] = sortedSessions.map((session) => ({
      week_number: session.week_number,
      session_date: session.session_date,
      entry_time: session.entry_time,
      exit_time: session.exit_time,
      theme: session.theme,
      objectives: session.objectives,
      devoir_title: session.devoir_title,
      devoir_date: session.devoir_date,
      remarks: session.remarks,
    }));

    const monthLabel = new Date(`${monthValue}-01T00:00:00`).toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });

    setExporting(true);
    try {
      await exportTeacherControlSheetPdf({
        teacherName,
        className: selectedClass.name,
        subjectName: "Informatique",
        monthLabel,
        sessions: sessionsForPdf,
      });
      toast.success("PDF exported.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate the PDF.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Teacher control sheet"
        description="Record each teaching session and export the monthly official control form."
        actions={
          <>
            <Button variant="outline" onClick={exportPdf} disabled={exporting || sessionsLoading}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
          </>
        }
      />

      <FilterBar>
        {teacherOptions.length ? (
          <FilterSelect
            label="Professeur"
            value={teacherId}
            onChange={setTeacherId}
            includeAll={false}
            options={teacherOptions}
          />
        ) : null}
        <FilterSelect
          label="Classe"
          value={classId}
          onChange={setClassId}
          includeAll={false}
          options={availableClasses.map((item) => ({ value: item.id, label: item.name }))}
        />
        <FilterSelect
          label="Cours"
          value={subjectId}
          onChange={setSubjectId}
          includeAll={false}
          options={(subjectsQuery.data ?? [])
            .filter((item) => !selectedClass || item.id === selectedClass.subject_id)
            .map((item) => ({ value: item.id, label: item.name }))}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Mois</Label>
          <Input
            type="month"
            className="w-full sm:w-[180px]"
            value={monthValue}
            onChange={(event) => setMonthValue(event.target.value)}
          />
        </div>
        <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
          <div className="font-medium">Status</div>
          <div>{completionState}</div>
        </div>
      </FilterBar>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="surface space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add a teaching session</h3>
            {editingId ? (
              <Button variant="outline" size="sm" onClick={resetDraft}>
                Cancel edit
              </Button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Semaine</Label>
              <Input
                type="number"
                min={1}
                max={53}
                value={draft.week_number}
                onChange={(event) =>
                  handleFieldChange("week_number", Number(event.target.value) || 1)
                }
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={draft.session_date}
                onChange={(event) => handleFieldChange("session_date", event.target.value)}
              />
            </div>
            <div>
              <Label>Heures d'entrée</Label>
              <Input
                type="time"
                value={draft.entry_time}
                onChange={(event) => handleFieldChange("entry_time", event.target.value)}
              />
            </div>
            <div>
              <Label>Heures de sortie</Label>
              <Input
                type="time"
                value={draft.exit_time}
                onChange={(event) => handleFieldChange("exit_time", event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Unité prévue (facultatif)</Label>
            <select
              className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value=""
              onChange={(event) => onUnitSuggestion(event.target.value)}
            >
              <option value="">Choisir une unité pour préremplir le thème et les objectifs</option>
              {unitSuggestions.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Thème</Label>
            <Input
              value={draft.theme}
              onChange={(event) => handleFieldChange("theme", event.target.value)}
            />
          </div>

          <div>
            <Label>Objectifs</Label>
            <Input
              value={draft.objectives}
              onChange={(event) => handleFieldChange("objectives", event.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Titre (devoir / leçon)</Label>
              <Input
                value={draft.devoir_title}
                onChange={(event) => handleFieldChange("devoir_title", event.target.value)}
              />
            </div>
            <div>
              <Label>Date de Remise</Label>
              <Input
                type="date"
                value={draft.devoir_date}
                onChange={(event) => handleFieldChange("devoir_date", event.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Remarques/Observations</Label>
            <Input
              value={draft.remarks}
              onChange={(event) => handleFieldChange("remarks", event.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetDraft}>
              Clear
            </Button>
            <Button onClick={saveSession} disabled={saving}>
              {editingId ? (
                <PencilLine className="mr-2 h-4 w-4" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {editingId ? "Update session" : "Save session"}
            </Button>
          </div>
        </div>

        <div className="surface p-4">
          <h3 className="mb-4 text-lg font-semibold">Recorded sessions</h3>
          {sessionsFailed ? (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            >
              Unable to load saved sessions:{" "}
              {sessionsError instanceof Error ? sessionsError.message : "Unknown database error."}
            </div>
          ) : sessionsLoading && sortedSessions.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">Loading saved sessions…</div>
          ) : sortedSessions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/25 p-6 text-sm text-muted-foreground">
              No sessions have been recorded for this combination yet.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedSessions.map((session) => (
                <div key={session.id} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">Week {session.week_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.session_date} · {session.entry_time}–{session.exit_time}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(session.id);
                          setDraft({
                            week_number: session.week_number,
                            session_date: session.session_date,
                            entry_time: session.entry_time,
                            exit_time: session.exit_time,
                            theme: session.theme,
                            objectives: session.objectives,
                            devoir_title: session.devoir_title,
                            devoir_date: session.devoir_date ?? "",
                            remarks: session.remarks ?? "",
                          });
                        }}
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void deleteSession(session.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Thème :</span> {session.theme}
                    </p>
                    <p>
                      <span className="font-medium">Objectifs :</span> {session.objectives}
                    </p>
                    <p>
                      <span className="font-medium">Devoir / leçon :</span> {session.devoir_title}
                      {session.devoir_date ? ` · ${session.devoir_date}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="surface mt-6 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Semaine</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Heures d'entrée</TableHead>
              <TableHead>Heures de sortie</TableHead>
              <TableHead>Thème</TableHead>
              <TableHead>Objectifs</TableHead>
              <TableHead>Devoir / Leçon</TableHead>
              <TableHead>Remarques / Observations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }, (_, index) => {
              const session = sortedSessions[index] ?? null;
              return (
                <TableRow key={`slot-${index}`}>
                  <TableCell>{session ? session.week_number : index + 1}</TableCell>
                  <TableCell>{session?.session_date ?? ""}</TableCell>
                  <TableCell>{session?.entry_time ?? ""}</TableCell>
                  <TableCell>{session?.exit_time ?? ""}</TableCell>
                  <TableCell>{session?.theme ?? ""}</TableCell>
                  <TableCell>{session?.objectives ?? ""}</TableCell>
                  <TableCell>
                    {session ? (
                      <>
                        <div>{session.devoir_title || ""}</div>
                        {session.devoir_date ? <div>{session.devoir_date}</div> : null}
                      </>
                    ) : null}
                  </TableCell>
                  <TableCell>{session?.remarks ?? ""}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
