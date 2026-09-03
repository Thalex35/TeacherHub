import { createFileRoute } from "@tanstack/react-router";
import { Table2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ALL, FilterBar, FilterSelect } from "@/components/filters";
import { GradeEntryDialog } from "@/components/grade-entry-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRemove, useUpsert } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Assessment } from "@/lib/types";
import { useAcademics } from "@/lib/useAcademics";

export const Route = createFileRoute("/_authenticated/gradebook")({
  head: () => ({
    meta: [
      { title: "Gradebook — TeacherHub" },
      {
        name: "description",
        content: "Filterable gradebook with automatic student, class and final-grade calculations.",
      },
      { property: "og:title", content: "Gradebook — TeacherHub" },
      { property: "og:description", content: "All grades and averages in one grid." },
    ],
  }),
  component: Gradebook,
});

function Gradebook() {
  const a = useAcademics();
  const upsertOverride = useUpsert("final_grade_overrides", "student_id,period_id");
  const removeOverride = useRemove("final_grade_overrides");

  const [classId, setClassId] = useState("");
  const [periodId, setPeriodId] = useState("");
  const [typeFilter, setTypeFilter] = useState(ALL);
  const [unitFilter, setUnitFilter] = useState(ALL);
  const [search, setSearch] = useState("");
  const [gradeTarget, setGradeTarget] = useState<Assessment | null>(null);

  const activeClass = classId || a.classes[0]?.id || "";
  const activePeriod = periodId || a.periods.find((p) => p.is_current)?.id || a.periods[0]?.id || "";

  const columns = a.assessments
    .filter(
      (x) =>
        x.class_id === activeClass &&
        (!activePeriod || x.period_id === activePeriod) &&
        (typeFilter === ALL || x.evaluation_type_id === typeFilter) &&
        (unitFilter === ALL || x.unit_id === unitFilter),
    )
    .sort((x, y) => x.date.localeCompare(y.date));

  const students = a.students
    .filter((s) => s.class_id === activeClass)
    .filter((s) => {
      const q = search.trim().toLowerCase();
      return !q || `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
    });

  const gradeFor = (studentId: string, assessmentId: string) =>
    a.grades.find((g) => g.student_id === studentId && g.assessment_id === assessmentId);

  const override = async (studentId: string, name: string) => {
    if (!a.settings?.allow_grade_override)
      { toast.error("Grade overrides are disabled in Settings."); return; }
    const current = a.overrides.find(
      (o) => o.student_id === studentId && o.period_id === activePeriod,
    );
    const input = window.prompt(
      `Override final grade for ${name} (0–${a.scale}). Leave empty to remove the override.`,
      current ? String(current.value) : "",
    );
    if (input === null) return;
    if (input.trim() === "") {
      if (current) {
        await removeOverride.mutateAsync(current.id);
        toast.success("Override removed.");
      }
      return;
    }
    const value = Number(input);
    if (Number.isNaN(value) || value < 0 || value > a.scale)
      { toast.error(`Enter a value between 0 and ${a.scale}.`); return; }
    await upsertOverride.mutateAsync({ student_id: studentId, period_id: activePeriod, value });
    toast.success("Final grade overridden.");
  };

  return (
    <div>
      <PageHeader
        title="Gradebook"
        description="Averages and final grades are calculated automatically from your grading rules."
      />

      <FilterBar>
        <FilterSelect
          label="Class"
          value={activeClass}
          onChange={setClassId}
          includeAll={false}
          options={a.classes.map((c) => ({ value: c.id, label: c.name }))}
        />
        <FilterSelect
          label="Academic period"
          value={activePeriod}
          onChange={setPeriodId}
          includeAll={false}
          options={a.periods.map((p) => ({ value: p.id, label: p.name }))}
        />
        <FilterSelect
          label="Evaluation type"
          value={typeFilter}
          onChange={setTypeFilter}
          placeholder="All types"
          options={a.types.map((t) => ({ value: t.id, label: t.name }))}
        />
        <FilterSelect
          label="Unit"
          value={unitFilter}
          onChange={setUnitFilter}
          placeholder="All units"
          options={Array.from(
            new Map(
              columns
                .filter((c) => c.unit_id)
                .map((c) => [c.unit_id as string, c.unit_id as string]),
            ).keys(),
          ).map((id) => ({ value: id, label: "Unit" }))}
        />
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Student</Label>
          <Input
            className="w-full sm:w-[200px]"
            placeholder="Search student"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </FilterBar>

      {students.length === 0 ? (
        <EmptyState
          icon={Table2}
          title="Nothing to show"
          description="Select a class that has students, or clear the filters."
        />
      ) : (
        <div className="surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-card">Student</TableHead>
                {columns.map((c) => (
                  <TableHead key={c.id} className="whitespace-nowrap text-right">
                    <button
                      className="hover:underline"
                      onClick={() => setGradeTarget(c)}
                      title={`${c.title} · ${formatDate(c.date)}`}
                    >
                      {c.title}
                    </button>
                  </TableHead>
                ))}
                <TableHead className="text-right">Average</TableHead>
                <TableHead className="text-right">Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const final = activePeriod ? a.finalGrade(s.id, activePeriod) : null;
                return (
                  <TableRow key={s.id}>
                    <TableCell className="sticky left-0 bg-card font-medium">
                      {s.first_name} {s.last_name}
                    </TableCell>
                    {columns.map((c) => {
                      const g = gradeFor(s.id, c.id);
                      return (
                        <TableCell key={c.id} className="numeric text-right">
                          {g?.score === null || g === undefined ? "—" : Number(g.score)}
                        </TableCell>
                      );
                    })}
                    <TableCell className="numeric text-right font-medium">
                      {a.studentAverage(s.id, activePeriod) ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        className="numeric inline-flex items-center gap-2 hover:underline"
                        onClick={() => override(s.id, `${s.first_name} ${s.last_name}`)}
                      >
                        {final?.value === null || final === null ? "—" : final.value}
                        {final?.overridden ? (
                          <Badge variant="outline">Overridden</Badge>
                        ) : null}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell className="sticky left-0 bg-card font-semibold">Class average</TableCell>
                {columns.map((c) => (
                  <TableCell key={c.id} className="numeric text-right font-semibold">
                    {a.assessmentAverage(c.id) ?? "—"}
                  </TableCell>
                ))}
                <TableCell className="numeric text-right font-semibold">
                  {a.classAverage(activeClass, activePeriod) ?? "—"}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {columns.length === 0 && students.length > 0 ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No assessments match these filters yet. Create an assignment or evaluation to start grading.
        </p>
      ) : null}

      <GradeEntryDialog
        assessment={gradeTarget}
        open={Boolean(gradeTarget)}
        onOpenChange={(v) => !v && setGradeTarget(null)}
        students={a.students.filter((s) => s.class_id === gradeTarget?.class_id)}
        grades={a.grades}
      />
    </div>
  );
}
