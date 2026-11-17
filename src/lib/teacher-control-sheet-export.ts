import { jsPDF } from "jspdf";
import regularFontUrl from "dejavu-fonts-ttf/ttf/DejaVuSans.ttf?url";
import boldFontUrl from "dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf?url";

import { safeFilename } from "./report-export";

export type TeacherControlSessionPdfEntry = {
  week_number: number;
  session_date: string;
  entry_time: string;
  exit_time: string;
  theme: string;
  objectives: string;
  devoir_title: string;
  devoir_date: string | null;
  remarks: string | null;
};

export type TeacherControlSheetPdfInput = {
  teacherName: string;
  className: string;
  subjectName: string;
  monthLabel: string;
  sessions: TeacherControlSessionPdfEntry[];
};

const SCHOOL_NAME = "ECOLE SECOURS D'EN HAUT DE PUITS SALES";
const MARGIN = 8;
const TABLE_TOP = 49;
const HEADER_HEIGHT = 14;
const ROW_HEIGHT = 27;
const ROWS_PER_FORM = 5;
const CELL_FONT_SIZE = 7;
const MIN_CELL_FONT_SIZE = 4.5;
const CELL_LINE_HEIGHT_FACTOR = 0.44;
const CELL_TEXT_TOP_PADDING = 4;
const CELL_TEXT_BOTTOM_PADDING = 2.5;
const COLUMN_WIDTHS = [17, 21, 27, 27, 38, 39, 48, 65];
const HEADERS = [
  "Semaine",
  "Date",
  "Heures d'entrée",
  "Heures de sortie",
  "Thème",
  "Objectifs",
  "Devoir / leçon",
  "Remarques/Observations",
];

async function loadFontAsBase64(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load PDF font: ${response.statusText}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function safeText(value: string | null | undefined) {
  return (value ?? "").trim();
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" }).format(date);
}

function wrapParagraphs(pdf: jsPDF, value: string, width: number) {
  return value.split("\n").flatMap((paragraph) => {
    if (!paragraph) return [""];
    return pdf.splitTextToSize(paragraph, width).map(String);
  });
}

function splitTeacherName(fullName: string) {
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  if (names.length < 2) return { surname: names[0] ?? "", firstName: "" };
  return { surname: names[names.length - 1] ?? "", firstName: names.slice(0, -1).join(" ") };
}

function drawHeader(pdf: jsPDF, input: TeacherControlSheetPdfInput) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const { surname, firstName } = splitTeacherName(input.teacherName);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("TeacherHubSans", "bold");
  pdf.setFontSize(11);
  pdf.text(SCHOOL_NAME, pageWidth / 2, 11, { align: "center" });
  pdf.setFontSize(13);
  pdf.text("Fiche de contrôle des Professeurs", pageWidth / 2, 20, { align: "center" });

  pdf.setFont("TeacherHubSans", "normal");
  pdf.setFontSize(9);
  const writeField = (label: string, value: string, x: number, y: number, width: number) => {
    pdf.text(label, x, y);
    const labelWidth = pdf.getTextWidth(label) + 2;
    const lineX = x + labelWidth;
    pdf.line(lineX, y + 0.5, x + width, y + 0.5);
    if (value) pdf.text(value, lineX + 1, y - 0.4, { maxWidth: width - labelWidth - 2 });
  };

  const innerWidth = pageWidth - MARGIN * 2;
  const half = innerWidth / 2;
  const thirds = innerWidth / 3;
  writeField("Prénom :", firstName, MARGIN, 31, thirds - 4);
  writeField("Nom :", surname, MARGIN + thirds, 31, thirds - 4);
  writeField("Cours :", "Informatique", MARGIN + thirds * 2, 31, thirds - 4);

  writeField("Mois de :", input.monthLabel, MARGIN, 40, thirds - 4);
  writeField("Classe :", input.className, MARGIN + thirds, 40, thirds - 4);
}

type SessionCellValues = [string, string, string, string, string, string, string, string];

function sessionCells(
  sessions: TeacherControlSessionPdfEntry[] | undefined,
  weekNumber: number,
): SessionCellValues {
  if (!sessions?.length)
    return [String(weekNumber), "", "", "", "", "", "Titre :\n\nDate de remise :", ""];
  const joinValues = (getValue: (session: TeacherControlSessionPdfEntry) => string) =>
    sessions.map(getValue).filter(Boolean).join("\n\n");

  return [
    String(weekNumber),
    joinValues((session) => formatDate(session.session_date)),
    joinValues((session) => safeText(session.entry_time)),
    joinValues((session) => safeText(session.exit_time)),
    joinValues((session) => safeText(session.theme)),
    joinValues((session) => safeText(session.objectives)),
    sessions
      .map(
        (session) =>
          `Titre : ${safeText(session.devoir_title)}\n\nDate de remise : ${formatDate(session.devoir_date ?? "")}`,
      )
      .join("\n\n"),
    joinValues((session) => safeText(session.remarks)),
  ];
}

type PreparedRow = {
  lines: string[][];
  minimumHeight: number;
  height: number;
  targetHeight: number;
};

function prepareRows(
  pdf: jsPDF,
  sessions: (TeacherControlSessionPdfEntry[] | undefined)[],
  firstSessionNumber: number,
  fontSize: number,
) {
  const lineHeight = fontSize * CELL_LINE_HEIGHT_FACTOR;
  pdf.setFont("TeacherHubSans", "normal");
  pdf.setFontSize(fontSize);

  return sessions.map((weekSessions, sessionIndex) => {
    const values = sessionCells(weekSessions, firstSessionNumber + sessionIndex);
    const lines = values.map((value, columnIndex) => {
      const width = COLUMN_WIDTHS[columnIndex];
      if (width === undefined) throw new Error(`Missing width for PDF column ${columnIndex}.`);
      return wrapParagraphs(pdf, value, width - 2);
    });
    const maxLines = Math.max(...lines.map((cellLines) => cellLines.length));
    const minimumHeight = Math.max(
      12,
      CELL_TEXT_TOP_PADDING +
        (maxLines - 1) * lineHeight +
        fontSize * 0.3528 +
        CELL_TEXT_BOTTOM_PADDING,
    );

    return { lines, minimumHeight, height: minimumHeight, targetHeight: minimumHeight };
  });
}

function fitRowsToPage(
  pdf: jsPDF,
  sessions: (TeacherControlSessionPdfEntry[] | undefined)[],
  firstSessionNumber: number,
) {
  const pageHeight = pdf.internal.pageSize.getHeight();
  const availableHeight = pageHeight - MARGIN - (TABLE_TOP + HEADER_HEIGHT);

  for (let fontStep = CELL_FONT_SIZE * 4; fontStep >= MIN_CELL_FONT_SIZE * 4; fontStep -= 1) {
    const fontSize = fontStep / 4;
    const rows = prepareRows(pdf, sessions, firstSessionNumber, fontSize);
    const minimumTotal = rows.reduce((total, row) => total + row.minimumHeight, 0);
    if (minimumTotal > availableHeight) continue;

    rows.forEach((row) => {
      row.targetHeight = Math.max(ROW_HEIGHT, row.minimumHeight);
    });
    const targetTotal = rows.reduce((total, row) => total + row.targetHeight, 0);
    if (targetTotal <= availableHeight) {
      rows.forEach((row) => {
        row.height = row.targetHeight;
      });
    } else {
      let remaining = availableHeight - minimumTotal;
      while (remaining > 0.01) {
        const growingRows = rows
          .filter((row) => row.height < row.targetHeight - 0.01);
        if (!growingRows.length) break;

        const share = remaining / growingRows.length;
        let used = 0;
        growingRows.forEach((row) => {
          const growth = Math.min(share, row.targetHeight - row.height);
          row.height += growth;
          used += growth;
        });
        remaining -= used;
      }
    }

    return { rows, fontSize, lineHeight: fontSize * CELL_LINE_HEIGHT_FACTOR };
  }

  throw new Error(
    "This sheet has too much detail to fit on one page. Shorten the session text and try again.",
  );
}

function drawFormPage(
  pdf: jsPDF,
  input: TeacherControlSheetPdfInput,
  rows: PreparedRow[],
  fontSize: number,
  lineHeight: number,
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  drawHeader(pdf, input);

  const tableWidth = COLUMN_WIDTHS.reduce((total, width) => total + width, 0);
  const tableLeft = (pageWidth - tableWidth) / 2;
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.25);

  let x = tableLeft;
  HEADERS.forEach((header, columnIndex) => {
    const width = COLUMN_WIDTHS[columnIndex];
    if (width === undefined) throw new Error(`Missing width for PDF column ${columnIndex}.`);
    pdf.rect(x, TABLE_TOP, width, HEADER_HEIGHT);
    pdf.setFont("TeacherHubSans", "bold");
    pdf.setFontSize(7.5);
    const headerLines = wrapParagraphs(pdf, header, width - 2);
    const headerLineHeight = 3.1;
    const firstBaseline =
      TABLE_TOP + (HEADER_HEIGHT - (headerLines.length - 1) * headerLineHeight) / 2 + 1;
    headerLines.forEach((line, index) =>
      pdf.text(line, x + width / 2, firstBaseline + index * headerLineHeight, { align: "center" }),
    );
    x += width;
  });

  let top = TABLE_TOP + HEADER_HEIGHT;
  rows.forEach((row) => {
    let cellX = tableLeft;
    row.lines.forEach((lines, columnIndex) => {
      const width = COLUMN_WIDTHS[columnIndex];
      if (width === undefined) throw new Error(`Missing width for PDF column ${columnIndex}.`);
      pdf.rect(cellX, top, width, row.height);
      pdf.setFont("TeacherHubSans", "normal");
      pdf.setFontSize(fontSize);
      lines.forEach((line, lineIndex) => {
        pdf.text(line, cellX + 1, top + CELL_TEXT_TOP_PADDING + lineIndex * lineHeight);
      });
      cellX += width;
    });
    top += row.height;
  });
}

export async function createTeacherControlSheetPdf(input: TeacherControlSheetPdfInput) {
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const [regularFont, boldFont] = await Promise.all([
    loadFontAsBase64(regularFontUrl),
    loadFontAsBase64(boldFontUrl),
  ]);
  pdf.addFileToVFS("TeacherHubSans-Regular.ttf", regularFont);
  pdf.addFont("TeacherHubSans-Regular.ttf", "TeacherHubSans", "normal");
  pdf.addFileToVFS("TeacherHubSans-Bold.ttf", boldFont);
  pdf.addFont("TeacherHubSans-Bold.ttf", "TeacherHubSans", "bold");
  const sessionsByWeek = new Map<number, TeacherControlSessionPdfEntry[]>();
  for (const session of [...input.sessions].sort(
    (a, b) =>
      a.week_number - b.week_number ||
      a.session_date.localeCompare(b.session_date) ||
      a.entry_time.localeCompare(b.entry_time),
  )) {
    const weekSessions = sessionsByWeek.get(session.week_number) ?? [];
    weekSessions.push(session);
    sessionsByWeek.set(session.week_number, weekSessions);
  }

  const lastWeek = Math.max(ROWS_PER_FORM, ...sessionsByWeek.keys());
  const pageSessions = Array.from({ length: lastWeek }, (_, index) =>
    sessionsByWeek.get(index + 1),
  );
  const { rows, fontSize, lineHeight } = fitRowsToPage(pdf, pageSessions, 1);
  drawFormPage(pdf, input, rows, fontSize, lineHeight);
  return pdf;
}

export async function exportTeacherControlSheetPdf(input: TeacherControlSheetPdfInput) {
  const filename = ["fiche-controle", input.className, input.subjectName, input.monthLabel]
    .map(safeFilename)
    .join("-")
    .concat(".pdf");
  (await createTeacherControlSheetPdf(input)).save(filename);
}
