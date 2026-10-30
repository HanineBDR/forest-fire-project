"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Building2,
  UserCheck,
  Flame,
  Camera,
} from "lucide-react";
import { loginUser, DEMO_ACCOUNTS, UserRole, getStoredToken, getStoredUser } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import CitizenReportModal from "@/components/CitizenReportModal";

export default function LoginPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);
  const [showCitizenModal, setShowCitizenModal] = useState<boolean>(false);

  // If already authenticated, redirect to /dashboard
  React.useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t("login_err_required"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await loginUser(email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        err.message ||
          (language === "ar"
            ? "بيانات الاعتماد غير صالحة."
            : language === "en"
            ? "Invalid credentials."
            : "Identifiants invalides.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemo(account.email);
    setError(null);
    setLoading(true);

    try {
      await loginUser(account.email, account.password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(
        err.message ||
          (language === "ar"
            ? "خطأ في تسجيل الدخول."
            : language === "en"
            ? "Connection error."
            : "Erreur de connexion.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-red-900 selection:text-white">
      {/* Institutional Top Ribbon */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200 uppercase tracking-wider">
              {t("login_republic")}
            </span>
            <span className="text-slate-600">|</span>
            <span>{t("login_ministry")}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              {t("login_secured_system")}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Authentication Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md space-y-5">
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center mb-2">
              <Image
                src="/logo.png"
                alt="INKAD Official Emblem"
                width={76}
                height={76}
                className="w-20 h-20 select-none object-contain drop-shadow"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t("login_portal_title")}
            </h1>
            <p className="text-sm text-slate-400">
              {t("login_portal_desc")}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t("login_secure_tag")}</span>
            </div>
          </div>

          {/* Emergency Citizen Fire Reporting Banner (Mobile-First Accessible) */}
          <button
            type="button"
            onClick={() => setShowCitizenModal(true)}
            className="w-full text-left p-3.5 rounded-xl border border-red-700/80 bg-red-950/60 hover:bg-red-900/60 transition-colors duration-150 flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 shadow-md shadow-red-950/30"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-900/80 border border-red-600 flex items-center justify-center text-red-400 group-hover:text-white shrink-0">
                <Flame className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{t("citizen_emergency_btn") || "Signaler un Foyer d'Incendie"}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase tracking-wider">
                    {language === "ar" ? "مواطن" : language === "en" ? "CITIZEN" : "CITOYEN"}
                  </span>
                </div>
                <p className="text-[11px] text-red-200/80 leading-snug">
                  {t("citizen_emergency_sub") ||
                    "Accès citoyen d'urgence sans mot de passe · Alerte directe Protection Civile & Forêts"}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-red-400 group-hover:text-white shrink-0 ml-2" />
          </button>

          {/* Quick Profile Selector for Operational Testing */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider text-slate-400">
                {t("login_quick_profiles")}
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-medium">
                {t("login_roles_authorized")}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const localizedRoleLabel =
                  acc.role === "CIVIL_PROTECTION"
                    ? t("role_protection_civile")
                    : acc.role === "FOREST_GUARD"
                    ? t("role_dgf")
                    : t("role_admin_centrale");

                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleDemoSelect(acc)}
                    disabled={loading}
                    className="w-full text-left p-2.5 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800/80 transition-colors duration-150 flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                        {acc.role === "CIVIL_PROTECTION" && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />
                        )}
                        {acc.role === "FOREST_GUARD" && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
                        )}
                        {acc.role === "ADMIN" && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />
                        )}
                        {localizedRoleLabel}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {acc.email}
                      </div>
                    </div>
                    <ArrowRight
                      className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0"
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Form */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div
                  role="alert"
                  className="p-3 rounded-md border border-red-900/80 bg-red-950/40 text-red-200 text-xs flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-semibold text-slate-300 block">
                  {t("login_email_label")}
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officier@inkad.dz"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-300 block">
                    {t("login_password_label")}
                  </label>
                  <span className="text-[11px] text-slate-500">{t("login_case_sensitive")}</span>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors duration-150 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium text-sm transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>{t("login_verifying")}</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>{t("login_submit")}</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 flex flex-col items-center gap-2 text-center">
              <p className="text-xs text-slate-400">
                {t("login_public_disabled")}
              </p>
              <button
                type="button"
                onClick={() => setShowCitizenModal(true)}
                className="text-xs text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 flex items-center gap-1.5 transition"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>{t("citizen_emergency_btn") || "Signaler un Foyer d'Incendie"}</span>
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded border border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>{t("login_security_notice_title")}</span>
            </div>
            <p>
              {t("login_security_notice_desc")}
            </p>
          </div>
        </div>
      </div>

      {/* Citizen Fire Report Emergency Modal */}
      <CitizenReportModal
        isOpen={showCitizenModal}
        onClose={() => setShowCitizenModal(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-3 px-6 text-center text-xs text-slate-500">
        {t("login_footer")}
      </footer>
    </div>
  );
}
