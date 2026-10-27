"use client";

/**
 * IN9AD Platform - Client-Side & Backend Export Utilities
 * Supporting CSV, JSON, PDF (jsPDF + autoTable with IN9AD Editorial theme), and Excel (XLSX).
 */

function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 150);
}

/**
 * 1. Export rows to CSV
 */
export function exportToCSV(rows: Record<string, any>[], filename = "in9ad_report.csv"): void {
  if (!rows || rows.length === 0) {
    const emptyBlob = new Blob(["No data available\n"], { type: "text/csv;charset=utf-8;" });
    downloadBlob(emptyBlob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvLines: string[] = [];

  // Header line
  csvLines.push(headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","));

  // Row lines
  for (const row of rows) {
    const line = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      const strVal = String(val).replace(/"/g, '""');
      return `"${strVal}"`;
    }).join(",");
    csvLines.push(line);
  }

  const csvContent = csvLines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

/**
 * 2. Export rows to JSON
 */
export function exportToJSON(rows: Record<string, any>[], filename = "in9ad_report.json"): void {
  const jsonString = JSON.stringify(rows || [], null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, filename.endsWith(".json") ? filename : `${filename}.json`);
}

/**
 * 3. Export rows to PDF (Dark Green #0A4D3C header, Cream #F5F1E8 text, striped rows)
 */
export async function exportToPDF(
  rows: Record<string, any>[],
  title = "IN9AD Operational Wildfire Report",
  filename = "in9ad_report.pdf"
): Promise<void> {
  try {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({
      orientation: rows.length && Object.keys(rows[0]).length > 6 ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });

    const isLandscape = doc.internal.pageSize.getWidth() > doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header Background (#0A4D3C Dark Green)
    doc.setFillColor(10, 77, 60);
    doc.rect(0, 0, pageWidth, 60, "F");

    // Title in Cream (#F5F1E8)
    doc.setTextColor(245, 241, 232);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("IN9AD (EN: Saving) - Wildfire Intelligence Platform", 30, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `${title} · Generated: ${new Date().toLocaleString("fr-DZ")} · Algerian Civil Protection & DGF`,
      30,
      46
    );

    if (!rows || rows.length === 0) {
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(12);
      doc.text("No records to display.", 30, 100);
      const pdfBlob = doc.output("blob");
      downloadBlob(pdfBlob, filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
      return;
    }

    const headers = Object.keys(rows[0]);
    const bodyData = rows.map((row) =>
      headers.map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return "";
        if (typeof val === "object") return JSON.stringify(val);
        return String(val);
      })
    );

    autoTable(doc, {
      startY: 75,
      head: [headers.map((h) => h.toUpperCase().replace(/_/g, " "))],
      body: bodyData,
      theme: "striped",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        textColor: [26, 46, 40],
        lineColor: [232, 220, 198],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: [10, 77, 60],
        textColor: [245, 241, 232],
        fontStyle: "bold",
        fontSize: 9.5,
      },
      alternateRowStyles: {
        fillColor: [245, 241, 232],
      },
      margin: { left: 30, right: 30, bottom: 40 },
      didDrawPage: (data) => {
        // Footer
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Page ${data.pageNumber} · IN9AD PFE Research Project · République Algérienne Démocratique et Populaire`,
          30,
          doc.internal.pageSize.getHeight() - 15
        );
      },
    });

    const pdfBlob = doc.output("blob");
    downloadBlob(pdfBlob, filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
  } catch (err) {
    console.error("Client-side PDF generation failed, falling back to CSV:", err);
    exportToCSV(rows, filename.replace(/\.pdf$/, ".csv"));
  }
}

/**
 * 4. Export rows to Excel (XLSX) with automatic CSV fallback
 */
export async function exportToExcel(
  rows: Record<string, any>[],
  filename = "in9ad_report.xlsx"
): Promise<void> {
  try {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows || []);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "IN9AD Report");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    downloadBlob(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
  } catch (err) {
    console.warn("XLSX export failed, falling back to CSV:", err);
    exportToCSV(rows, filename.replace(/\.xlsx$/, ".csv"));
  }
}

/**
 * 5. Export from backend API with Blob download
 */
export async function exportFromBackend(
  type: "csv" | "pdf" | "json" | "xlsx",
  filters: Record<string, any> = {},
  fallbackRows: Record<string, any>[] = []
): Promise<void> {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
  const token = typeof window !== "undefined" ? localStorage.getItem("in9ad_auth_token") : null;

  try {
    const res = await fetch(`${apiBase}/api/reports/export?type=${type}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(filters || {}),
    });

    if (res.ok) {
      const blob = await res.blob();
      const filename = `in9ad_report_${new Date().toISOString().slice(0, 10)}.${type}`;
      downloadBlob(blob, filename);
      return;
    }
  } catch (err) {
    console.warn(`Backend export (${type}) unavailable, switching to client-side generator:`, err);
  }

  // Graceful client-side fallback if backend API is unreachable or returned error
  const filename = `in9ad_report_${new Date().toISOString().slice(0, 10)}`;
  if (type === "csv") {
    exportToCSV(fallbackRows, `${filename}.csv`);
  } else if (type === "json") {
    exportToJSON(fallbackRows, `${filename}.json`);
  } else if (type === "pdf") {
    await exportToPDF(fallbackRows, "IN9AD Wildfire Report", `${filename}.pdf`);
  } else if (type === "xlsx") {
    await exportToExcel(fallbackRows, `${filename}.xlsx`);
  }
}
