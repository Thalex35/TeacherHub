import { FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useState } from "react";

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
import { type CurriculumImportRow, parseCurriculumFile } from "@/lib/curriculum-import";
import type { Lesson, Topic, Unit } from "@/lib/types";

type CurriculumImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  topics: Topic[];
  lessons: Lesson[];
  onImport: (rows: CurriculumImportRow[]) => Promise<CurriculumImportSummary>;
};

export type CurriculumImportSummary = {
  units: number;
  topics: number;
  lessons: number;
  skipped: number;
  errors: { rowNumber: number; error: string }[];
};

function key(value: string) {
  return value.trim().toLocaleLowerCase();
}

function readableFileError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "";
  if (
    message.startsWith("Missing required column") ||
    message === "The spreadsheet is empty." ||
    message === "The spreadsheet has no curriculum rows."
  ) {
    return message;
  }
  return "The file could not be read. Check that it is a valid, uncorrupted CSV, XLS, or XLSX file.";
}

export function CurriculumImportDialog({
  open,
  onOpenChange,
  units,
  topics,
  lessons,
  onImport,
}: CurriculumImportDialogProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<CurriculumImportRow[]>([]);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<CurriculumImportSummary | null>(null);

  const preview = useMemo(() => {
    const unitKeys = new Set(units.map((unit) => key(unit.title)));
    const topicKeys = new Set(topics.map((topic) => `${topic.unit_id}\u0000${key(topic.title)}`));
    const lessonKeys = new Set(
      lessons.map(
        (lesson) =>
          `${lesson.unit_id ?? ""}\u0000${lesson.topic_id ?? ""}\u0000${key(lesson.title)}`,
      ),
    );
    const previewUnits = new Set<string>();
    const previewTopics = new Set<string>();
    const previewLessons = new Set<string>();

    const validRows = rows.filter((row) => row.errors.length === 0);
    for (const row of validRows) {
      const unitKey = key(row.unit);
      previewUnits.add(unitKey);
      const topicKey = `${unitKey}\u0000${key(row.topic)}`;
      previewTopics.add(topicKey);
      previewLessons.add(`${topicKey}\u0000${key(row.lesson)}`);
    }

    return {
      validRows,
      invalidRows: rows.filter((row) => row.errors.length > 0),
      unitCount: previewUnits.size,
      topicCount: previewTopics.size,
      lessonCount: previewLessons.size,
      existingUnits: [...previewUnits].filter((unitKey) => unitKeys.has(unitKey)).length,
      existingTopics: [...previewTopics].filter((topicKey) =>
        [...topicKeys].some((existing) =>
          existing.endsWith(`\u0000${topicKey.split("\u0000")[1]}`),
        ),
      ).length,
      existingLessons: [...previewLessons].filter((lessonKey) =>
        [...lessonKeys].some((existing) =>
          existing.endsWith(`\u0000${lessonKey.split("\u0000")[2]}`),
        ),
      ).length,
    };
  }, [lessons, rows, topics, units]);

  const reset = () => {
    setFileName("");
    setRows([]);
    setError("");
    setProcessing(false);
    setSummary(null);
  };

  const close = () => {
    reset();
    onOpenChange(false);
  };

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !["csv", "xls", "xlsx"].includes(extension)) {
      setError("Choose a CSV, XLS, or XLSX file.");
      return;
    }
    setProcessing(true);
    setError("");
    setSummary(null);
    try {
      setRows(await parseCurriculumFile(file));
      setFileName(file.name);
    } catch (cause) {
      setRows([]);
      setFileName("");
      setError(readableFileError(cause));
    } finally {
      setProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!preview.validRows.length) return;
    setProcessing(true);
    setError("");
    try {
      setSummary(await onImport(preview.validRows));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The curriculum could not be imported.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : close())}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import curriculum</DialogTitle>
          <DialogDescription>
            Upload a CSV, XLS, or XLSX file with Unit, Topic, and Lesson columns. Repeated names are
            grouped into the same hierarchy.
          </DialogDescription>
        </DialogHeader>

        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-4 hover:border-primary/60">
          <FileSpreadsheet className="size-5 text-primary" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Choose a curriculum file</span>
            <span className="block truncate text-xs text-muted-foreground">
              {fileName || "Accepted formats: .csv, .xls, .xlsx"}
            </span>
          </span>
          <Upload className="size-4 text-muted-foreground" />
          <Input
            type="file"
            accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => void selectFile(event.target.files?.[0])}
            disabled={processing}
          />
        </label>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {rows.length ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="font-medium">{preview.unitCount} Units</span>
              <span className="font-medium">{preview.topicCount} Topics</span>
              <span className="font-medium">{preview.lessonCount} Lessons</span>
              {preview.invalidRows.length ? (
                <span className="text-destructive">
                  {preview.invalidRows.length} rows have errors
                </span>
              ) : null}
            </div>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Row</th>
                    <th className="px-3 py-2 font-medium">Unit</th>
                    <th className="px-3 py-2 font-medium">Topic</th>
                    <th className="px-3 py-2 font-medium">Lesson</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.rowNumber} className="border-t border-border align-top">
                      <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                      <td className="px-3 py-2">{row.unit || "—"}</td>
                      <td className="px-3 py-2">{row.topic || "—"}</td>
                      <td className="px-3 py-2">{row.lesson || "—"}</td>
                      <td className="max-w-xs px-3 py-2">{row.description || "—"}</td>
                      <td className="px-3 py-2">
                        {row.errors.length ? (
                          <span className="text-destructive">{row.errors.join("; ")}</span>
                        ) : (
                          <span className="text-primary">Ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {summary ? (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-semibold">Curriculum import complete</p>
            <p className="mt-1">Units created or reused: {summary.units}</p>
            <p>Topics created or reused: {summary.topics}</p>
            <p>Lessons created: {summary.lessons}</p>
            <p>Duplicates skipped: {summary.skipped}</p>
            {summary.errors.map((item) => (
              <p key={`${item.rowNumber}-${item.error}`} className="text-destructive">
                Row {item.rowNumber}: {item.error}
              </p>
            ))}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {summary ? "Close" : "Cancel"}
          </Button>
          {!summary ? (
            <Button
              onClick={() => void confirmImport()}
              disabled={processing || !preview.validRows.length}
            >
              {processing ? "Importing..." : "Import curriculum"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
