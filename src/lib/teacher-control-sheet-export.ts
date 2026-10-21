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
const CELL_LABELS = [
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
  return { surname: names[names.length - 1], firstName: names.slice(0, -1).join(" ") };
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

function sessionCells(sessions: TeacherControlSessionPdfEntry[] | undefined, weekNumber: number) {
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

type OverflowEntry = { sessionNumber: number; label: string; text: string };

function drawFormPage(
  pdf: jsPDF,
  input: TeacherControlSheetPdfInput,
  sessions: (TeacherControlSessionPdfEntry[] | undefined)[],
  firstSessionNumber: number,
  overflow: OverflowEntry[],
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
    pdf.rect(x, TABLE_TOP, width, HEADER_HEIGHT);
    pdf.setFont("TeacherHubSans", "bold");
    pdf.setFontSize(7.5);
    const headerLines = wrapParagraphs(pdf, header, width - 2);
    const lineHeight = 3.1;
    const firstBaseline =
      TABLE_TOP + (HEADER_HEIGHT - (headerLines.length - 1) * lineHeight) / 2 + 1;
    headerLines.forEach((line, index) =>
      pdf.text(line, x + width / 2, firstBaseline + index * lineHeight, { align: "center" }),
    );
    x += width;
  });

  const maxLines = Math.floor((ROW_HEIGHT - 5) / 3.1);
  sessions.forEach((weekSessions, sessionIndex) => {
    const globalIndex = firstSessionNumber + sessionIndex;
    const values = sessionCells(weekSessions, globalIndex);
    const top = TABLE_TOP + HEADER_HEIGHT + sessionIndex * ROW_HEIGHT;
    let cellX = tableLeft;

    values.forEach((value, columnIndex) => {
      const width = COLUMN_WIDTHS[columnIndex];
      pdf.rect(cellX, top, width, ROW_HEIGHT);
      pdf.setFont("TeacherHubSans", "normal");
      pdf.setFontSize(7);
      const lines = wrapParagraphs(pdf, value, width - 2);
      const isDevoirCell = columnIndex === 6;
      const visibleLines = lines.slice(0, maxLines);
      const baseline = top + (isDevoirCell ? 4 : 4);
      visibleLines.forEach((line, lineIndex) => {
        pdf.text(line, cellX + 1, baseline + lineIndex * 3.1);
      });

      if (lines.length > maxLines) {
        overflow.push({
          sessionNumber: globalIndex,
          label: CELL_LABELS[columnIndex],
          text: lines.slice(maxLines).join("\n"),
        });
      }
      cellX += width;
    });
  });
}

function drawOverflowPages(
  pdf: jsPDF,
  input: TeacherControlSheetPdfInput,
  entries: OverflowEntry[],
) {
  if (!entries.length) return;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN * 2;
  let y = 28;

  const drawContinuationHeader = () => {
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("TeacherHubSans", "bold");
    pdf.setFontSize(13);
    pdf.text("Fiche de contrôle des professeurs — suite", pageWidth / 2, 15, {
      align: "center",
    });
    pdf.setFont("TeacherHubSans", "normal");
    pdf.setFontSize(9);
    pdf.text(
      `Professeur : ${input.teacherName} · Classe : ${input.className} · Cours : Informatique · Mois : ${input.monthLabel}`,
      pageWidth / 2,
      22,
      { align: "center" },
    );
    y = 32;
  };

  drawContinuationHeader();
  entries.forEach((entry) => {
    pdf.setFont("TeacherHubSans", "bold");
    pdf.setFontSize(9);
    const heading = `Séance ${entry.sessionNumber} — ${entry.label} (suite)`;
    if (y + 10 > pageHeight - MARGIN) {
      pdf.addPage();
      drawContinuationHeader();
    }
    pdf.text(heading, MARGIN, y);
    y += 5;

    pdf.setFont("TeacherHubSans", "normal");
    pdf.setFontSize(9);
    const lines = wrapParagraphs(pdf, entry.text, contentWidth);
    for (const line of lines) {
      if (y + 5 > pageHeight - MARGIN) {
        pdf.addPage();
        drawContinuationHeader();
        pdf.setFont("TeacherHubSans", "normal");
        pdf.setFontSize(9);
      }
      pdf.text(line, MARGIN, y);
      y += 4.5;
    }
    y += 3;
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
  const overflow: OverflowEntry[] = [];
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
  const pages = Math.ceil(lastWeek / ROWS_PER_FORM);

  for (let page = 0; page < pages; page += 1) {
    if (page > 0) pdf.addPage();
    const start = page * ROWS_PER_FORM;
    const pageSessions = Array.from({ length: ROWS_PER_FORM }, (_, index) =>
      sessionsByWeek.get(start + index + 1),
    );
    drawFormPage(pdf, input, pageSessions, start + 1, overflow);
  }

  drawOverflowPages(pdf, input, overflow);
  return pdf;
}

export async function exportTeacherControlSheetPdf(input: TeacherControlSheetPdfInput) {
  const filename = ["fiche-controle", input.className, input.subjectName, input.monthLabel]
    .map(safeFilename)
    .join("-")
    .concat(".pdf");
  (await createTeacherControlSheetPdf(input)).save(filename);
}
