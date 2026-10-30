"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Key, 
  Mail, 
  Building, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  X
} from "lucide-react";
import { getStoredUser, getStoredToken, getLocalizedUserName, AuthUser, UserRole } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { RoleGate } from "@/components/RoleGate";

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization?: string;
  organization_ar?: string;
  created_at?: string;
}

const DEFAULT_USERS: ManagedUser[] = [
  {
    id: "usr-admin-01",
    email: "admin@in9ad.dz",
    name: "Direction Générale - Super Admin",
    role: "ADMIN",
    organization: "Ministère de l'Intérieur / IN9AD Admin",
    organization_ar: "الإدارة المركزية",
    created_at: "2024-01-15T08:00:00Z"
  },
  {
    id: "usr-protect-01",
    email: "protection@in9ad.dz",
    name: "Commandant Protection Civile",
    role: "CIVIL_PROTECTION",
    organization: "Direction Générale de la Protection Civile (DGPC)",
    organization_ar: "الحماية المدنية",
    created_at: "2024-02-01T09:30:00Z"
  },
  {
    id: "usr-foret-01",
    email: "foret@in9ad.dz",
    name: "Inspecteur Principal des Forêts",
    role: "FOREST_GUARD",
    organization: "Direction Générale des Forêts (DGF - Kabylie)",
    organization_ar: "محافظة الغابات",
    created_at: "2024-02-15T10:15:00Z"
  }
];

export default function UsersManagementPage() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<ManagedUser[]>(DEFAULT_USERS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New user form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("CIVIL_PROTECTION");
  const [newOrg, setNewOrg] = useState("");

  const currentUser = getStoredUser();

  const fetchUsers = async () => {
    const token = getStoredToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const res = await fetch(`${apiBase}/auth/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
        }
      }
    } catch {
      // Keep state
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setLoading(true);

    const token = getStoredToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      const res = await fetch(`${apiBase}/auth/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          name: newName,
          role: newRole,
          organization: newOrg,
        }),
      });

      if (res.ok) {
        const created: ManagedUser = await res.json();
        setUsers(prev => [created, ...prev.filter(u => u.email !== created.email)]);
        setActionSuccess(`Compte pour ${created.name} créé avec succès.`);
        setIsModalOpen(false);
        // Reset form
        setNewEmail("");
        setNewName("");
        setNewPassword("");
        setNewOrg("");
      } else {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Erreur de création de compte.");
      }
    } catch (err: any) {
      // Local addition fallback if backend is offline
      const localNew: ManagedUser = {
        id: `usr-${Date.now().toString(36)}`,
        email: newEmail,
        name: newName,
        role: newRole,
        organization: newOrg || "Service Opérationnel",
        organization_ar: newRole === "CIVIL_PROTECTION" ? "الحماية المدنية" : "محافظة الغابات",
        created_at: new Date().toISOString()
      };
      setUsers(prev => [localNew, ...prev]);
      setActionSuccess(`Compte pour ${newName} enregistré localement.`);
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email: string) => {
    if (["admin@in9ad.dz", "protection@in9ad.dz", "foret@in9ad.dz"].includes(email)) {
      setActionError("Impossible de supprimer les comptes de démonstration permanents du jury.");
      return;
    }

    if (!confirm(`Supprimer définitivement l'accès pour ${email} ?`)) return;

    setActionError(null);
    const token = getStoredToken();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    try {
      await fetch(`${apiBase}/auth/users/${encodeURIComponent(email)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // ignore
    }

    setUsers(prev => prev.filter(u => u.email !== email));
    setActionSuccess(`Compte ${email} révoqué.`);
  };

  return (
    <RoleGate allowedRoles={["ADMIN"]} redirectTo="/dashboard" showToast={true}>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-semibold">
              {t("users_admin_badge")}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-blue-400" />
            <span>{t("users_title")}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {t("users_subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <UserPlus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{t("users_create_btn")}</span>
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded border border-red-900 bg-red-950/40 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 rounded border border-emerald-900 bg-emerald-950/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
              <tr>
                <th className="py-3 px-4">{t("users_col_personnel")}</th>
                <th className="py-3 px-4">{t("users_col_email")}</th>
                <th className="py-3 px-4">{t("users_col_role")}</th>
                <th className="py-3 px-4">{t("users_col_org")}</th>
                <th className="py-3 px-4 text-right">{language === "ar" ? "الإجراءات" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isPermanentDemo = ["admin@in9ad.dz", "protection@in9ad.dz", "foret@in9ad.dz"].includes(u.email);

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{getLocalizedUserName(u.name, u.role, language)}</div>
                      <div className="text-[11px] text-slate-500 font-mono">ID: {u.id}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          u.role === "CIVIL_PROTECTION"
                            ? "bg-red-950 text-red-300 border border-red-800"
                            : u.role === "FOREST_GUARD"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : "bg-blue-950 text-blue-300 border border-blue-800"
                        }`}
                      >
                        {u.role === "CIVIL_PROTECTION" && (language === "ar" ? "الحماية المدنية" : language === "en" ? "Civil Protection" : "Protection Civile")}
                        {u.role === "FOREST_GUARD" && (language === "ar" ? "محافظة الغابات" : language === "en" ? "Forest Conservation" : "Conservation des Forêts")}
                        {u.role === "ADMIN" && (language === "ar" ? "الإدارة المركزية" : language === "en" ? "Central Administration" : "Direction Générale")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {language === "ar"
                        ? u.organization_ar || u.organization || "N/A"
                        : language === "en"
                        ? (u.organization?.includes("Intérieur")
                            ? "Ministry of Interior / IN9AD Admin"
                            : u.organization?.includes("Protection Civile")
                            ? "General Directorate of Civil Protection (DGPC)"
                            : u.organization?.includes("Forêts")
                            ? "General Directorate of Forests (DGF - Kabylie)"
                            : u.organization || "N/A")
                        : u.organization || "N/A"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isPermanentDemo ? (
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          {language === "ar" ? "حساب محمي للجنة" : language === "en" ? "Protected Jury Account" : "Compte Jury Protégé"}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.email)}
                          aria-label={`Revoke access for ${u.name}`}
                          className="p-1.5 rounded-md hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-900 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          title="Revoke access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
                <span>{t("users_modal_create_title")}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label={t("close")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">{t("users_officer_name_label")}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Lieutenant Karim Belkacem"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">{t("users_officer_email_label")}</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="officier.tizi@in9ad.dz"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">{t("users_temp_password_label")}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={6}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">{t("users_role_label")}</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                >
                  <option value="CIVIL_PROTECTION">{t("role_protection_civile")}</option>
                  <option value="FOREST_GUARD">{t("role_dgf")}</option>
                  <option value="ADMIN">{t("role_admin_centrale")}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">{t("users_unit_label")}</label>
                <input
                  type="text"
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  placeholder="Unité Principale Tizi Ouzou"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                >
                  {t("users_cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
                >
                  {loading ? t("users_creating") : t("users_submit_create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </RoleGate>
  );
}
