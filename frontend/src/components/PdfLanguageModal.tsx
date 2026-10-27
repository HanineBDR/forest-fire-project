"use client";

import React, { useState } from "react";
import { X, FileText, CheckCircle2, Download } from "lucide-react";
import { useLanguage, Language } from "@/context/LanguageContext";

interface PdfLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (lang: Language) => void;
  isGenerating?: boolean;
  documentTitle?: string;
}

export const PdfLanguageModal: React.FC<PdfLanguageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isGenerating = false,
  documentTitle,
}) => {
  const { language: currentLang } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<Language>(currentLang || "fr");

  if (!isOpen) return null;

  const options: { id: Language; label: string; sublabel: string; flag: string }[] = [
    {
      id: "fr",
      label: "Français",
      sublabel: "Document administratif officiel (Protection Civile & DGF)",
      flag: "🇫🇷",
    },
    {
      id: "en",
      label: "English",
      sublabel: "International Tactical Wildfire & Incident Briefing",
      flag: "🇬🇧",
    },
    {
      id: "ar",
      label: "العربية",
      sublabel: "النسخة الرسمية المعتمدة للحماية المدنية ومحافظة الغابات",
      flag: "🇩🇿",
    },
  ];

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 id="pdf-modal-title" className="text-sm font-bold text-white">
                {currentLang === "ar"
                  ? "اختيار لغة استخراج التقرير PDF"
                  : currentLang === "en"
                  ? "Select PDF Report Language"
                  : "Choisir la langue du rapport PDF"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {documentTitle ||
                  (currentLang === "ar"
                    ? "اختر لغة المستند الرسمي قبل التحميل"
                    : currentLang === "en"
                    ? "Select official document language before generating"
                    : "Sélectionnez la langue du document officiel avant l'export")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Language Selection List */}
        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = selectedLang === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedLang(opt.id)}
                className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all duration-150 ${
                  isSelected
                    ? "bg-red-950/60 border-red-500 ring-1 ring-red-500/60 text-white shadow-sm"
                    : "bg-slate-800/40 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{opt.flag}</span>
                  <div>
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span>{opt.label}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-mono uppercase">
                          {currentLang === "ar" ? "محدد" : currentLang === "en" ? "Selected" : "Sélectionné"}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.sublabel}</div>
                  </div>
                </div>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {currentLang === "ar" ? "إلغاء" : currentLang === "en" ? "Cancel" : "Annuler"}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedLang)}
            disabled={isGenerating}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white flex items-center gap-2 shadow-md transition disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>
                  {currentLang === "ar"
                    ? "جاري التوليد..."
                    : currentLang === "en"
                    ? "Generating PDF..."
                    : "Génération du PDF..."}
                </span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {currentLang === "ar"
                    ? "تأكيد واستخراج PDF"
                    : currentLang === "en"
                    ? "Confirm & Download PDF"
                    : "Confirmer & Télécharger PDF"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
