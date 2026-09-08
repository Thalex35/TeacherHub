import * as XLSX from "xlsx";

export type ImportedStudentRow = {
  rowNumber: number;
  firstName: string;
  lastName: string;
  className: string;
  errors: string[];
};

export type StudentImportParseResult = {
  rows: ImportedStudentRow[];
  headers: {
    firstName: string;
    lastName: string;
    className: string;
  };
};

const FIRST_NAME_HEADERS = new Set(["firstname"]);
const LAST_NAME_HEADERS = new Set(["lastname"]);
const CLASS_HEADERS = new Set(["class", "grade", "classname"]);

export function normalizeImportHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function cellText(value: unknown) {
  return String(value ?? "").trim();
}

function findHeaderIndex(headers: unknown[], accepted: Set<string>) {
  return headers.findIndex((header) => accepted.has(normalizeImportHeader(header)));
}

export async function parseStudentWorkbook(file: File): Promise<StudentImportParseResult> {
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: false,
  });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error("The spreadsheet is empty.");
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error("The spreadsheet could not be read.");

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const headerIndex = rows.findIndex((row) => row.some((cell) => cellText(cell)));
  if (headerIndex < 0) throw new Error("The spreadsheet is empty.");

  const headers = rows[headerIndex] ?? [];
  const firstNameIndex = findHeaderIndex(headers, FIRST_NAME_HEADERS);
  const lastNameIndex = findHeaderIndex(headers, LAST_NAME_HEADERS);
  const classIndex = findHeaderIndex(headers, CLASS_HEADERS);
  const missing = [
    firstNameIndex < 0 ? "First Name" : "",
    lastNameIndex < 0 ? "Last Name" : "",
    classIndex < 0 ? "Class" : "",
  ].filter(Boolean);
  if (missing.length) {
    throw new Error(
      `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.`,
    );
  }

  const parsedRows = rows.slice(headerIndex + 1).flatMap((row, index) => {
    const firstName = cellText(row[firstNameIndex]);
    const lastName = cellText(row[lastNameIndex]);
    const className = cellText(row[classIndex]);
    if (!firstName && !lastName && !className) return [];
    const errors = [
      !firstName ? "Missing First Name" : "",
      !lastName ? "Missing Last Name" : "",
      !className ? "Missing Class" : "",
    ].filter(Boolean);
    return [{ rowNumber: headerIndex + index + 2, firstName, lastName, className, errors }];
  });

  if (!parsedRows.length) throw new Error("The spreadsheet has no student rows.");
  return {
    rows: parsedRows,
    headers: {
      firstName: String(headers[firstNameIndex] ?? "First Name"),
      lastName: String(headers[lastNameIndex] ?? "Last Name"),
      className: String(headers[classIndex] ?? "Class"),
    },
  };
}

export function importStudentKey(firstName: string, lastName: string, classId: string) {
  return `${firstName.trim().toLocaleLowerCase()}\u0000${lastName.trim().toLocaleLowerCase()}\u0000${classId}`;
}
