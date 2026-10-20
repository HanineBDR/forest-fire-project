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
  Lock
} from "lucide-react";
import { getStoredUser, getStoredToken, AuthUser, UserRole } from "@/lib/auth";

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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-semibold">
              Administration Centrale (RBAC)
            </span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Gestion des Comptes & Accréditations Officielles</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Délivrance et révocation des accès opérationnels pour la Protection Civile et les Forêts
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Créer un Compte Autorisé</span>
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
                <th className="py-3 px-4">Personnel & Titre</th>
                <th className="py-3 px-4">Identifiant E-mail</th>
                <th className="py-3 px-4">Rôle Institutionnel</th>
                <th className="py-3 px-4">Direction / Unité</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const isPermanentDemo = ["admin@in9ad.dz", "protection@in9ad.dz", "foret@in9ad.dz"].includes(u.email);

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{u.name}</div>
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
                        {u.role === "CIVIL_PROTECTION" && "الحماية المدنية"}
                        {u.role === "FOREST_GUARD" && "محافظة الغابات"}
                        {u.role === "ADMIN" && "الإدارة المركزية"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {u.organization || "—"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isPermanentDemo ? (
                        <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800">
                          Compte Jury Protégé
                        </span>
                      ) : (
                        <button
                          onClick={() => handleDeleteUser(u.email)}
                          className="p-1.5 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-900 transition"
                          title="Révoquer cet accès"
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
                <UserPlus className="w-4 h-4 text-red-500" />
                <span>Créer un Compte Opérationnel</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">Nom & Titre de l'Officier</label>
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
                <label className="text-xs font-semibold text-slate-300 block">E-mail Professionnel</label>
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
                <label className="text-xs font-semibold text-slate-300 block">Mot de passe provisoire</label>
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
                <label className="text-xs font-semibold text-slate-300 block">Corps / Rôle Attribué</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                >
                  <option value="CIVIL_PROTECTION">الحماية المدنية (Protection Civile)</option>
                  <option value="FOREST_GUARD">محافظة الغابات (Conservation des Forêts)</option>
                  <option value="ADMIN">الإدارة المركزية (Super Admin)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 block">Unité / Affectation</label>
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
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition"
                >
                  {loading ? "Création en cours…" : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
