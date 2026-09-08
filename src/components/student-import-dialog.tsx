import { FileSpreadsheet, Upload } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ImportedStudentRow,
  importStudentKey,
  parseStudentWorkbook,
} from "@/lib/student-import";
import type { Klass, Student } from "@/lib/types";

export type StudentImportRow = ImportedStudentRow & { classId: string };

export type StudentImportResult = {
  imported: number;
  failed: { rowNumber: number; error: string }[];
};

type StudentImportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: Klass[];
  students: Student[];
  onImport: (rows: StudentImportRow[]) => Promise<StudentImportResult>;
};

type ImportSummary = StudentImportResult & {
  duplicates: number;
  invalid: number;
};

function classMatch(value: string, className: string) {
  const normalizedValue = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const normalizedClass = className
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (normalizedValue === normalizedClass) return true;

  const gradeAlias = /^(7|8|9)(?:th|st|nd|rd)?grade$/.exec(normalizedValue);
  return Boolean(gradeAlias && normalizedClass === `${gradeAlias[1]}e`);
}

function readableFileError(cause: unknown) {
  const message = cause instanceof Error ? cause.message : "";
  if (
    message.startsWith("Missing required column") ||
    message === "The spreadsheet is empty." ||
    message === "The spreadsheet has no student rows."
  ) {
    return message;
  }
  return "The Excel file could not be read. Check that it is a valid, uncorrupted .xlsx or .xls file.";
}

export function StudentImportDialog({
  open,
  onOpenChange,
  classes,
  students,
  onImport,
}: StudentImportDialogProps) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportedStudentRow[]>([]);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  const preparedRows = useMemo(() => {
    const existingKeys = new Set(
      students.map((student) =>
        importStudentKey(student.first_name, student.last_name, student.class_id),
      ),
    );
    const seenKeys = new Set<string>();
    return rows.map((row) => {
      const matchedClass = classes.find((klass) => classMatch(row.className, klass.name));
      const errors = [...row.errors];
      if (!matchedClass && row.className) errors.push(`Invalid class: ${row.className}`);
      const key = matchedClass
        ? importStudentKey(row.firstName, row.lastName, matchedClass.id)
        : "";
      const duplicate = Boolean(key && (existingKeys.has(key) || seenKeys.has(key)));
      if (key) seenKeys.add(key);
      return {
        ...row,
        classId: matchedClass?.id ?? "",
        errors,
        duplicate,
      };
    });
  }, [classes, rows, students]);

  const validRows = preparedRows.filter((row) => row.errors.length === 0 && !row.duplicate);
  const invalidRows = preparedRows.filter((row) => row.errors.length > 0);
  const duplicateCount = preparedRows.filter((row) => row.duplicate).length;

  const reset = () => {
    setFileName("");
    setRows([]);
    setError("");
    setProcessing(false);
    setSummary(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const selectFile = async (file: File | undefined) => {
    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (extension !== "xlsx" && extension !== "xls") {
      setError("Choose an Excel file with an .xlsx or .xls extension.");
      return;
    }
    setProcessing(true);
    setError("");
    setSummary(null);
    try {
      const parsed = await parseStudentWorkbook(file);
      setFileName(file.name);
      setRows(parsed.rows);
    } catch (cause) {
      setRows([]);
      setFileName("");
      setError(readableFileError(cause));
    } finally {
      setProcessing(false);
    }
  };

  const confirmImport = async () => {
    if (!validRows.length) return;
    setProcessing(true);
    setError("");
    try {
      const result = await onImport(validRows);
      setSummary({
        ...result,
        duplicates: duplicateCount,
        invalid: invalidRows.length,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The students could not be imported.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import students from Excel</DialogTitle>
          <DialogDescription>
            Only First Name, Last Name and Class are read. All other spreadsheet columns are
            ignored.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-border p-4 transition-colors hover:border-primary/60">
            <FileSpreadsheet className="size-5 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Choose an Excel file</span>
              <span className="block truncate text-xs text-muted-foreground">
                {fileName || "Accepted formats: .xlsx and .xls"}
              </span>
            </span>
            <Upload className="size-4 text-muted-foreground" />
            <Input
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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

          {preparedRows.length ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-medium">{validRows.length} students ready to import</span>
                {invalidRows.length ? (
                  <span className="text-destructive">{invalidRows.length} rows have errors</span>
                ) : null}
                {duplicateCount ? (
                  <span className="text-muted-foreground">
                    {duplicateCount} duplicates will be skipped
                  </span>
                ) : null}
              </div>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Row</th>
                      <th className="px-3 py-2 font-medium">First Name</th>
                      <th className="px-3 py-2 font-medium">Last Name</th>
                      <th className="px-3 py-2 font-medium">Class</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preparedRows.map((row) => (
                      <tr key={row.rowNumber} className="border-t border-border align-top">
                        <td className="px-3 py-2 text-muted-foreground">{row.rowNumber}</td>
                        <td className="px-3 py-2">{row.firstName || "—"}</td>
                        <td className="px-3 py-2">{row.lastName || "—"}</td>
                        <td className="px-3 py-2">{row.className || "—"}</td>
                        <td className="px-3 py-2">
                          {row.errors.length ? (
                            <span className="text-destructive">{row.errors.join("; ")}</span>
                          ) : row.duplicate ? (
                            <span className="text-muted-foreground">Duplicate, skipped</span>
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
              <p className="font-semibold">Student import complete</p>
              <p className="mt-1">Imported: {summary.imported}</p>
              <p>Skipped duplicates: {summary.duplicates}</p>
              <p>Invalid rows: {summary.invalid}</p>
              {summary.failed.length ? (
                <div className="mt-2 text-destructive">
                  {summary.failed.map((failure) => (
                    <p key={`${failure.rowNumber}-${failure.error}`}>
                      Row {failure.rowNumber}: {failure.error}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            {summary ? "Close" : "Cancel"}
          </Button>
          {!summary ? (
            <Button
              onClick={() => void confirmImport()}
              disabled={processing || validRows.length === 0}
            >
              {processing ? "Processing..." : "Import students"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
