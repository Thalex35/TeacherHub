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
  metadata?: { label: string; value: string }[];
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
  const metadata = report.metadata
    ? [
        csvValue(report.title),
        ...report.metadata.map(({ label, value }) => `${csvValue(label)},${csvValue(value)}`),
        "",
      ].join("\r\n")
    : "";
  downloadBlob(
    new Blob(["\uFEFF", metadata, `${header}\r\n${body}\r\n`], {
      type: "text/csv;charset=utf-8",
    }),
    filename,
  );
}

export function exportExcel(report: ExportReport, filename: string) {
  if (!report.rows.length) throw new Error("No report data available to export.");
  const headers = report.columns.map((column) => column.header);
  const data = report.rows.map((row) => report.columns.map((column) => row[column.key] ?? ""));
  const metadataRows = report.metadata
    ? [[report.title], ...report.metadata.map(({ label, value }) => [label, value]), [], headers]
    : [headers];
  const sheet = XLSX.utils.aoa_to_sheet([...metadataRows, ...data]);
  sheet["!cols"] = report.columns.map((column) => ({
    wch: Math.min(
      36,
      Math.max(
        column.header.length + 2,
        ...report.rows.map((row) => displayValue(row[column.key]).length + 2),
      ),
    ),
  }));
  sheet["!freeze"] = { xSplit: 0, ySplit: metadataRows.length };
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
  let y = 14;

  pdf.setTextColor(0, 0, 0);
  if (report.schoolName) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(report.schoolName, margin, y);
    y += 7;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(report.title, margin, y);
  y += 10;

  if (report.subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(report.subtitle, margin, y, { maxWidth: usableWidth });
    y += 7;
  }

  const metadata = report.metadata
    ? report.metadata.map(({ label, value }) => [label, value])
    : [
        ["Classe", report.className],
        ["Contrôle", String(report.control)],
        ["Professeur", report.teacherName],
        ["Date", report.date],
      ];
  const metadataColumnWidth = usableWidth / 2;
  metadata.forEach(([label, value], index) => {
    const column = index % 2;
    const x = margin + column * metadataColumnWidth;
    const labelWidth = 22;
    const lines = pdf.splitTextToSize(String(value), metadataColumnWidth - labelWidth - 3);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${label}:`, x, y);
    pdf.setFont("helvetica", "normal");
    pdf.text(lines, x + labelWidth, y);
    if (column === 1 || index === metadata.length - 1) {
      const rowLines =
        column === 1
          ? Math.max(
              pdf.splitTextToSize(
                String(metadata[index - 1]?.[1] ?? ""),
                metadataColumnWidth - labelWidth - 3,
              ).length,
              lines.length,
            )
          : lines.length;
      y += rowLines * 4 + 3;
    }
  });

  y += 3;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  const headerLines = report.columns.map((column) =>
    pdf.splitTextToSize(column.header, columnWidth - 4),
  );
  const headerHeight = Math.max(...headerLines.map((lines) => lines.length), 1) * 4.5;
  headerLines.forEach((lines, index) => pdf.text(lines, margin + index * columnWidth + 2, y));
  y += headerHeight + 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  report.rows.forEach((row) => {
    const values = report.columns.map((column) => displayValue(row[column.key]));
    const lines = values.map((value) => pdf.splitTextToSize(value, columnWidth - 4));
    const rowHeight = Math.max(...lines.map((value) => value.length), 1) * 4.5 + 5;
    if (y + rowHeight > pageHeight - 14) {
      pdf.addPage();
      y = 14;
    }
    lines.forEach((value, index) =>
      pdf.text(value, margin + index * columnWidth + 2, y, { maxWidth: columnWidth - 4 }),
    );
    y += rowHeight;
  });
  pdf.save(filename);
}
