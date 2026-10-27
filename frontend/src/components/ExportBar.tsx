"use client";

import React, { useState } from "react";
import { FileSpreadsheet, FileText, FileJson, Table, Loader2 } from "lucide-react";
import {
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportToExcel,
  exportFromBackend,
} from "@/lib/export";

interface ExportBarProps {
  data: Record<string, any>[];
  title?: string;
  filenamePrefix?: string;
  useBackendFirst?: boolean;
  filters?: Record<string, any>;
  className?: string;
}

export const ExportBar: React.FC<ExportBarProps> = ({
  data,
  title = "IN9AD Operational Intelligence Report",
  filenamePrefix = "in9ad_report",
  useBackendFirst = false,
  filters = {},
  className = "",
}) => {
  const [loadingType, setLoadingType] = useState<string | null>(null);

  const handleExport = async (type: "csv" | "pdf" | "excel" | "json") => {
    setLoadingType(type);
    const dateStr = new Date().toISOString().slice(0, 10);
    const baseName = `${filenamePrefix}_${dateStr}`;

    try {
      if (useBackendFirst) {
        await exportFromBackend(
          type === "excel" ? "xlsx" : type,
          filters,
          data
        );
      } else {
        if (type === "csv") {
          exportToCSV(data, `${baseName}.csv`);
        } else if (type === "json") {
          exportToJSON(data, `${baseName}.json`);
        } else if (type === "pdf") {
          await exportToPDF(data, title, `${baseName}.pdf`);
        } else if (type === "excel") {
          await exportToExcel(data, `${baseName}.xlsx`);
        }
      }
    } catch (err) {
      console.error(`Export ${type} error:`, err);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className={`p-4 bg-cream-300/40 rounded-[20px] border border-pine-800/10 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-bold text-pine-800 font-sans">
            Export operational dossiers & telemetry
          </h3>
          <p className="text-[12px] text-pine-800/60 font-sans">
            Download verified datasets for Algerian Civil Protection (DPC) & Forest Conservation (DGF).
          </p>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-pine-800/10 text-pine-800 self-start sm:self-auto">
          {data.length} records ready
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* CSV */}
        <button
          type="button"
          disabled={loadingType !== null}
          onClick={() => handleExport("csv")}
          className="bg-[#0A4D3C] text-[#F5F1E8] rounded-[16px] p-[14px] text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-opacity duration-150 flex items-center justify-center gap-2 disabled:opacity-60 font-sans cursor-pointer"
        >
          {loadingType === "csv" ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#F5F1E8]" />
          ) : (
            <Table className="w-4 h-4 text-[#F5F1E8]" />
          )}
          <span>Export CSV</span>
        </button>

        {/* PDF */}
        <button
          type="button"
          disabled={loadingType !== null}
          onClick={() => handleExport("pdf")}
          className="bg-[#0A4D3C] text-[#F5F1E8] rounded-[16px] p-[14px] text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-opacity duration-150 flex items-center justify-center gap-2 disabled:opacity-60 font-sans cursor-pointer"
        >
          {loadingType === "pdf" ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#F5F1E8]" />
          ) : (
            <FileText className="w-4 h-4 text-[#F5F1E8]" />
          )}
          <span>Export PDF</span>
        </button>

        {/* Excel */}
        <button
          type="button"
          disabled={loadingType !== null}
          onClick={() => handleExport("excel")}
          className="bg-[#0A4D3C] text-[#F5F1E8] rounded-[16px] p-[14px] text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-opacity duration-150 flex items-center justify-center gap-2 disabled:opacity-60 font-sans cursor-pointer"
        >
          {loadingType === "excel" ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#F5F1E8]" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-[#F5F1E8]" />
          )}
          <span>Export Excel</span>
        </button>

        {/* JSON */}
        <button
          type="button"
          disabled={loadingType !== null}
          onClick={() => handleExport("json")}
          className="bg-[#0A4D3C] text-[#F5F1E8] rounded-[16px] p-[14px] text-xs font-semibold hover:opacity-90 active:scale-[0.99] transition-opacity duration-150 flex items-center justify-center gap-2 disabled:opacity-60 font-sans cursor-pointer"
        >
          {loadingType === "json" ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#F5F1E8]" />
          ) : (
            <FileJson className="w-4 h-4 text-[#F5F1E8]" />
          )}
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
};
