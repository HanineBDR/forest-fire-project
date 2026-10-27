"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, KeyRound, AlertCircle, CheckCircle2, Lock, ArrowRight, Building2, UserCheck } from "lucide-react";
import { loginUser, DEMO_ACCOUNTS, UserRole } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez saisir votre adresse e-mail institutionnelle et votre mot de passe.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(email, password);
      if (res.role === "ADMIN") {
        router.push("/dashboard/admin/model-health");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedDemo(account.email);
    setError(null);
    setLoading(true);

    try {
      const res = await loginUser(account.email, account.password);
      if (res.role === "ADMIN") {
        router.push("/dashboard/admin/model-health");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de connexion.");
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
              الجمهورية الجزائرية الديمقراطية الشعبية
            </span>
            <span className="text-slate-600">|</span>
            <span>Ministère de l'Intérieur et des Collectivités Locales</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
              Système Sécurisé IN9AD
            </span>
          </div>
        </div>
      </div>

      {/* Main Authentication Container */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Header Card */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 mb-2">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Portail Opérationnel IN9AD
            </h1>
            <p className="text-sm text-slate-400">
              Plateforme décisionnelle de prédiction du risque incendie de forêt
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Chiffrement AES-256 & Jetons JWT Signés</span>
            </div>
          </div>

          {/* Quick Profile Selector for Operational Testing */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider text-slate-400">
                Accès rapide par profil opérationnel
              </span>
              <span className="text-[11px] text-emerald-400 font-mono font-medium">3 Rôles Autorisés</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleDemoSelect(acc)}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-md border border-slate-800 hover:border-slate-700 bg-slate-950/60 hover:bg-slate-800/80 transition-colors duration-150 flex items-center justify-between group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      {acc.role === "CIVIL_PROTECTION" && <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" aria-hidden="true" />}
                      {acc.role === "FOREST_GUARD" && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />}
                      {acc.role === "ADMIN" && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" aria-hidden="true" />}
                      {acc.label}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {acc.email}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" className="p-3 rounded-md border border-red-900/80 bg-red-950/40 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-xs font-semibold text-slate-300 block">
                  Identifiant Professionnel (E-mail)
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officier@in9ad.dz"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors duration-150"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-slate-300 block">
                    Mot de passe
                  </label>
                  <span className="text-[11px] text-slate-500">Sensible à la casse</span>
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
                  <span>Vérification des accréditations...</span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Ouvrir la session sécurisée</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Inscription publique désactivée. Les comptes opérationnels sont nominativement délivrés par l'Administration Centrale.
              </p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded border border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Avertissement Opérationnel de Sécurité</span>
            </div>
            <p>
              Toute fausse alerte ou tentative d'accès non autorisé fait l'objet d'un traçage cryptographique et d'un audit de responsabilité conformément à la réglementation nationale.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-3 px-6 text-center text-xs text-slate-500">
        Plateforme IN9AD (إنقاذ) · Direction Générale de la Protection Civile & Direction Générale des Forêts · Algérie
      </footer>
    </div>
  );
}
