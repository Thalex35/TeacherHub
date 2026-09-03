import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";

export type ExportValue = string | number | null | undefined;
export type ExportRow = Record<string, ExportValue>;

export interface ExportReport {
  title: string;
  subtitle: string;
  schoolName: string;
  className: string;
  control: number;
  teacherName: string;
  date: string;
  columns: { key: string; header: string }[];
  rows: ExportRow[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function safeFilename(value: string) {
  return (
    value
      .trim()
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "report"
  );
}

function displayValue(value: ExportValue) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function csvValue(value: ExportValue) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportCsv(report: ExportReport, filename: string) {
  if (!report.rows.length) throw new Error("No report data available to export.");
  const header = report.columns.map((column) => csvValue(column.header)).join(",");
  const body = report.rows
    .map((row) => report.columns.map((column) => csvValue(row[column.key])).join(","))
    .join("\r\n");
  downloadBlob(
    new Blob(["\uFEFF", `${header}\r\n${body}\r\n`], { type: "text/csv;charset=utf-8" }),
    filename,
  );
}

export function exportExcel(report: ExportReport, filename: string) {
  if (!report.rows.length) throw new Error("No report data available to export.");
  const rows = report.rows.map((row) =>
    Object.fromEntries(report.columns.map((column) => [column.header, row[column.key] ?? ""])),
  );
  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: report.columns.map((column) => column.header),
  });
  sheet["!cols"] = report.columns.map((column) => ({
    wch: Math.min(
      36,
      Math.max(
        column.header.length + 2,
        ...report.rows.map((row) => displayValue(row[column.key]).length + 2),
      ),
    ),
  }));
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, report.title.slice(0, 31));
  XLSX.writeFile(workbook, filename, { bookType: "xlsx" });
}

export function exportPdf(report: ExportReport, filename: string) {
  if (!report.rows.length) throw new Error("No report data available to export.");
  const pdf = new jsPDF({ orientation: report.columns.length > 5 ? "landscape" : "portrait" });
  const margin = 14;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;
  const columnWidth = usableWidth / report.columns.length;
  const colors = {
    ink: [24, 45, 67] as const,
    accent: [28, 145, 140] as const,
    pale: [241, 246, 247] as const,
    line: [214, 226, 229] as const,
    muted: [91, 108, 119] as const,
  };
  let y = 14;

  const drawHeader = () => {
    pdf.setFillColor(...colors.ink);
    pdf.roundedRect(margin, y, usableWidth, 34, 3, 3, "F");
    pdf.setFillColor(...colors.accent);
    pdf.roundedRect(margin, y, 5, 34, 3, 3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(report.schoolName.toUpperCase(), margin + 10, y + 10);
    pdf.setFontSize(17);
    pdf.text(report.title, margin + 10, y + 21);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text(report.subtitle, margin + 10, y + 29);
    pdf.setTextColor(...colors.ink);
    y += 41;

    pdf.setFillColor(...colors.pale);
    pdf.setDrawColor(...colors.line);
    pdf.roundedRect(margin, y, usableWidth, 22, 2, 2, "FD");
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...colors.muted);
    const metadata = [
      ["CLASS", report.className],
      ["CONTROL", String(report.control)],
      ["TEACHER", report.teacherName],
      ["DATE", report.date],
    ];
    metadata.forEach(([label, value], index) => {
      const x = margin + 8 + (index % 2) * (usableWidth * 0.5);
      const metadataY = y + 8 + Math.floor(index / 2) * 9;
      pdf.text(label, x, metadataY);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...colors.ink);
      pdf.text(value, x + 25, metadataY, { maxWidth: usableWidth * 0.5 - 35 });
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(...colors.muted);
    });
    y += 31;

    pdf.setFillColor(...colors.ink);
    pdf.roundedRect(margin, y - 5, usableWidth, 10, 1.5, 1.5, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    report.columns.forEach((column, index) => {
      pdf.text(column.header, margin + index * columnWidth + 2, y + 1, {
        maxWidth: columnWidth - 4,
      });
    });
    pdf.setTextColor(...colors.ink);
    pdf.setFont("helvetica", "normal");
    y += 11;
  };

  const pageNumber = () => {
    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.text(`Page ${pdf.getNumberOfPages()}`, pageWidth - margin, pageHeight - 8, {
      align: "right",
    });
    pdf.setTextColor(31, 41, 55);
  };

  drawHeader();
  report.rows.forEach((row, rowIndex) => {
    const values = report.columns.map((column) => displayValue(row[column.key]));
    const lines = values.map((value) => pdf.splitTextToSize(value, columnWidth - 4));
    const rowHeight = Math.max(...lines.map((value) => value.length), 1) * 4.5 + 6;
    if (y + rowHeight > pageHeight - 14) {
      pageNumber();
      pdf.addPage();
      y = 14;
      drawHeader();
    }
    if (rowIndex % 2 === 0) {
      pdf.setFillColor(...colors.pale);
      pdf.rect(margin, y - 4, usableWidth, rowHeight, "F");
    }
    pdf.setTextColor(...colors.ink);
    lines.forEach((value, index) =>
      pdf.text(value, margin + index * columnWidth + 2, y, { maxWidth: columnWidth - 4 }),
    );
    pdf.setDrawColor(...colors.line);
    pdf.line(margin, y + rowHeight - 3, margin + usableWidth, y + rowHeight - 3);
    for (let index = 1; index < report.columns.length; index += 1) {
      pdf.line(
        margin + index * columnWidth,
        y - 4,
        margin + index * columnWidth,
        y + rowHeight - 3,
      );
    }
    y += rowHeight;
  });
  pageNumber();
  pdf.save(filename);
}
