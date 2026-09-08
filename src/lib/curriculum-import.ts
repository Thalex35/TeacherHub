import * as XLSX from "xlsx";

export type CurriculumImportRow = {
  rowNumber: number;
  unit: string;
  topic: string;
  lesson: string;
  description: string;
  assignment: string;
  errors: string[];
};

const HEADER_ALIASES = {
  unit: new Set(["unit", "unitname", "unittitle"]),
  topic: new Set(["topic", "topicname", "section", "sectionname"]),
  lesson: new Set(["lesson", "lessonname", "lessontitle"]),
  description: new Set(["description", "lessondescription", "details"]),
  assignment: new Set(["assignment", "assignmenttype", "assignmentsection", "activity"]),
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function findColumn(headers: unknown[], aliases: Set<string>) {
  return headers.findIndex((header) => aliases.has(normalizeHeader(header)));
}

export async function parseCurriculumFile(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The spreadsheet is empty.");
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("The spreadsheet could not be read.");

  const values = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const headerRow = values.findIndex((row) => row.some((cell) => text(cell)));
  if (headerRow < 0) throw new Error("The spreadsheet is empty.");

  const headers = values[headerRow] ?? [];
  const columns = {
    unit: findColumn(headers, HEADER_ALIASES.unit),
    topic: findColumn(headers, HEADER_ALIASES.topic),
    lesson: findColumn(headers, HEADER_ALIASES.lesson),
    description: findColumn(headers, HEADER_ALIASES.description),
    assignment: findColumn(headers, HEADER_ALIASES.assignment),
  };
  const missing = [
    columns.unit < 0 ? "Unit" : "",
    columns.topic < 0 ? "Topic" : "",
    columns.lesson < 0 ? "Lesson" : "",
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(
      `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`,
    );
  }

  const rows = values.slice(headerRow + 1).flatMap((row, index) => {
    const parsed: CurriculumImportRow = {
      rowNumber: headerRow + index + 2,
      unit: text(row[columns.unit]),
      topic: text(row[columns.topic]),
      lesson: text(row[columns.lesson]),
      description: columns.description >= 0 ? text(row[columns.description]) : "",
      assignment: columns.assignment >= 0 ? text(row[columns.assignment]) : "",
      errors: [],
    };
    if (!parsed.unit && !parsed.topic && !parsed.lesson) return [];
    if (!parsed.unit) parsed.errors.push("Missing Unit");
    if (!parsed.topic) parsed.errors.push("Missing Topic");
    if (!parsed.lesson) parsed.errors.push("Missing Lesson");
    return [parsed];
  });

  if (!rows.length) throw new Error("The spreadsheet has no curriculum rows.");
  return rows;
}
