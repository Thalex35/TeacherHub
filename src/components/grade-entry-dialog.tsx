import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUpsert } from "@/lib/data";
import type { Assessment, Grade, Student } from "@/lib/types";

/** Fast whole-class grade entry for one assessment. */
export function GradeEntryDialog({
  assessment,
  students,
  grades,
  open,
  onOpenChange,
}: {
  assessment: Assessment | null;
  students: Student[];
  grades: Grade[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const upsert = useUpsert("grades", "assessment_id,student_id");
  const [values, setValues] = useState<Record<string, string>>({});

  const existing = useMemo(() => {
    const map: Record<string, string> = {};
    if (!assessment) return map;
    for (const g of grades) {
      if (g.assessment_id === assessment.id) map[g.student_id] = g.score === null ? "" : String(g.score);
    }
    return map;
  }, [grades, assessment]);

  useEffect(() => {
    if (open) setValues(existing);
  }, [open, existing]);

  if (!assessment) return null;
  const max = Number(assessment.max_grade);

  const save = async () => {
    const rows: Record<string, unknown>[] = [];
    for (const s of students) {
      const raw = values[s.id];
      if (raw === undefined || raw === "") continue;
      const score = Number(raw);
      if (Number.isNaN(score)) { toast.error(`Invalid grade for ${s.first_name} ${s.last_name}.`); return; }
      if (score < 0) { toast.error("Grades cannot be negative."); return; }
      if (score > max) { toast.error(`Grades cannot exceed the maximum of ${max}.`); return; }
      rows.push({ assessment_id: assessment.id, student_id: s.id, score });
    }
    if (!rows.length) { toast.error("Enter at least one grade."); return; }
    await upsert.mutateAsync(rows);
    toast.success(`${rows.length} grade(s) saved.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enter grades — {assessment.title}</DialogTitle>
          <DialogDescription>
            Maximum grade {max}. Leave a field empty to skip a student.
          </DialogDescription>
        </DialogHeader>
        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            This class has no students yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead className="w-32 text-right">Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    {s.first_name} {s.last_name}
                    {s.status !== "active" ? (
                      <span className="ml-2 text-xs text-muted-foreground">(inactive)</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      inputMode="decimal"
                      className="numeric ml-auto h-9 w-24 text-right"
                      value={values[s.id] ?? ""}
                      max={max}
                      min={0}
                      onChange={(e) => setValues((v) => ({ ...v, [s.id]: e.target.value }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={upsert.isPending}>
            Save grades
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
