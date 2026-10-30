"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Key, 
  Mail, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  X, 
  Phone, 
  Camera, 
  Upload, 
  AlertTriangle 
} from "lucide-react";
import { getStoredUser, getStoredToken, getLocalizedUserName, AuthUser, UserRole } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { RoleGate } from "@/components/RoleGate";
import { adminUpdateUser, adminDeleteUser } from "@/lib/api";

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
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
    phone: "+213 21 73 00 00",
    organization: "Ministère de l'Intérieur / IN9AD Admin",
    organization_ar: "الإدارة المركزية",
    created_at: "2024-01-15T08:00:00Z"
  },
  {
    id: "usr-protect-01",
    email: "protection@in9ad.dz",
    name: "Commandant Protection Civile",
    role: "CIVIL_PROTECTION",
    phone: "+213 26 20 14 14",
    organization: "Direction Générale de la Protection Civile (DGPC)",
    organization_ar: "الحماية المدنية",
    created_at: "2024-02-01T09:30:00Z"
  },
  {
    id: "usr-foret-01",
    email: "foret@in9ad.dz",
    name: "Inspecteur Principal des Forêts",
    role: "FOREST_GUARD",
    phone: "+213 26 21 88 02",
    organization: "Direction Générale des Forêts (DGF - Kabylie)",
    organization_ar: "محافظة الغابات",
    created_at: "2024-02-15T10:15:00Z"
  }
];

export default function UsersManagementPage() {
  const { t, language } = useLanguage();
  const [users, setUsers] = useState<ManagedUser[]>(DEFAULT_USERS);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  // Create form state
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<UserRole>("CIVIL_PROTECTION");
  const [createPhone, setCreatePhone] = useState("");
  const [createOrg, setCreateOrg] = useState("");
  const [createAvatar, setCreateAvatar] = useState<string | null>(null);
  const createFileInputRef = useRef<HTMLInputElement>(null);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<UserRole>("CIVIL_PROTECTION");
  const [editPhone, setEditPhone] = useState("");
  const [editOrg, setEditOrg] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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

  // Avatar helper with 2MB validation
  const handleAvatarUpload = (
    file: File, 
    setAvatarState: (data: string | null) => void
  ) => {
    setActionError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setActionError(t("profile_avatar_invalid_type") || "Only JPG, PNG, and WebP images are supported.");
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setActionError(t("profile_avatar_too_large") || "Image size exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarState(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Open Edit Modal
  const handleOpenEdit = (user: ManagedUser) => {
    setSelectedUser(user);
    setEditName(user.name || "");
    setEditRole(user.role);
    setEditPhone(user.phone || "");
    setEditOrg(user.organization || "");
    setEditPassword("");
    setEditAvatar(user.avatar || null);
    setActionError(null);
    setActionSuccess(null);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (user: ManagedUser) => {
    if (user.email.toLowerCase() === "admin@in9ad.dz") {
      setActionError(t("users_err_superadmin_immutable") || "The primary Super Admin account (admin@in9ad.dz) cannot be deleted.");
      return;
    }
    setSelectedUser(user);
    setActionError(null);
    setActionSuccess(null);
    setIsDeleteModalOpen(true);
  };

  // CREATE USER
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
          email: createEmail.trim().toLowerCase(),
          password: createPassword,
          name: createName.trim(),
          role: createRole,
          organization: createOrg.trim() || undefined,
          phone: createPhone.trim() || undefined,
          avatar: createAvatar || undefined,
        }),
      });

      if (res.ok) {
        const created: ManagedUser = await res.json();
        setUsers(prev => [created, ...prev.filter(u => u.email !== created.email)]);
        setActionSuccess(t("users_create_success") || `Account for ${created.name} created successfully.`);
        setIsCreateModalOpen(false);
        // Reset form
        setCreateEmail("");
        setCreateName("");
        setCreatePassword("");
        setCreatePhone("");
        setCreateOrg("");
        setCreateAvatar(null);
      } else {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || "Failed to create account.");
      }
    } catch (err: any) {
      // Local fallback in case backend is offline
      const localNew: ManagedUser = {
        id: `usr-${Date.now().toString(36)}`,
        email: createEmail.trim().toLowerCase(),
        name: createName.trim(),
        role: createRole,
        phone: createPhone.trim(),
        avatar: createAvatar || undefined,
        organization: createOrg || (createRole === "CIVIL_PROTECTION" ? "Protection Civile" : createRole === "FOREST_GUARD" ? "DGF" : "Administration"),
        organization_ar: createRole === "CIVIL_PROTECTION" ? "الحماية المدنية" : createRole === "FOREST_GUARD" ? "محافظة الغابات" : "الإدارة المركزية",
        created_at: new Date().toISOString()
      };
      setUsers(prev => [localNew, ...prev]);
      setActionSuccess(t("users_create_success") || `Account for ${createName} registered locally.`);
      setIsCreateModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // EDIT USER
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setActionError(null);
    setActionSuccess(null);
    setLoading(true);

    try {
      const payload: any = {
        name: editName.trim(),
        role: editRole,
        phone: editPhone.trim(),
        organization: editOrg.trim(),
        avatar: editAvatar || "",
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      await adminUpdateUser(selectedUser.email, payload);

      setUsers(prev => prev.map(u => {
        if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
          return {
            ...u,
            name: editName.trim(),
            role: editRole,
            phone: editPhone.trim(),
            organization: editOrg.trim(),
            avatar: editAvatar || undefined,
            organization_ar: editRole === "CIVIL_PROTECTION" ? "الحماية المدنية" : editRole === "FOREST_GUARD" ? "محافظة الغابات" : "الإدارة المركزية"
          };
        }
        return u;
      }));

      setActionSuccess(t("users_edit_success") || `Account for ${editName} updated successfully.`);
      setIsEditModalOpen(false);
    } catch (err: any) {
      // Fallback update locally
      setUsers(prev => prev.map(u => {
        if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
          return {
            ...u,
            name: editName.trim(),
            role: editRole,
            phone: editPhone.trim(),
            organization: editOrg.trim(),
            avatar: editAvatar || undefined,
          };
        }
        return u;
      }));
      setActionSuccess(t("users_edit_success") || `Account updated locally.`);
      setIsEditModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // DELETE USER
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    if (selectedUser.email.toLowerCase() === "admin@in9ad.dz") {
      setActionError(t("users_err_superadmin_immutable") || "The primary Super Admin account (admin@in9ad.dz) cannot be deleted.");
      setIsDeleteModalOpen(false);
      return;
    }

    setLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await adminDeleteUser(selectedUser.email);
      setUsers(prev => prev.filter(u => u.email.toLowerCase() !== selectedUser.email.toLowerCase()));
      setActionSuccess(t("users_delete_success") || `Account ${selectedUser.email} revoked successfully.`);
    } catch (err: any) {
      // Local removal fallback
      setUsers(prev => prev.filter(u => u.email.toLowerCase() !== selectedUser.email.toLowerCase()));
      setActionSuccess(t("users_delete_success") || `Account ${selectedUser.email} revoked.`);
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  return (
    <RoleGate allowedRoles={["ADMIN"]} redirectTo="/dashboard" showToast={true}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
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
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <UserPlus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t("users_create_btn")}</span>
          </button>
        </div>

        {/* Action alerts */}
        {actionError && (
          <div className="p-3.5 rounded-lg border border-red-900 bg-red-950/60 text-red-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="p-3.5 rounded-lg border border-emerald-900 bg-emerald-950/60 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-3 px-4">{t("users_col_personnel")}</th>
                  <th className="py-3 px-4">{t("users_col_email")}</th>
                  <th className="py-3 px-4">{t("users_col_role")}</th>
                  <th className="py-3 px-4">{t("users_col_phone") || "Phone / Contact"}</th>
                  <th className="py-3 px-4">{t("users_col_org")}</th>
                  <th className="py-3 px-4 text-right">{language === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isSuperAdmin = u.email.toLowerCase() === "admin@in9ad.dz";

                  return (
                    <tr key={u.id || u.email} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-semibold text-xs text-slate-300">
                                {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-200">{getLocalizedUserName(u.name, u.role, language)}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {u.id || "usr-assigned"}</div>
                          </div>
                        </div>
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

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {u.phone || "—"}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition"
                            title={t("users_edit_btn") || "Edit user"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button or Protected Badge */}
                          {isSuperAdmin ? (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/60"
                              title="Primary Super Admin account is permanent and cannot be deleted."
                            >
                              <Lock className="w-3 h-3" />
                              <span>{t("users_superadmin_protected") || "Protected"}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(u)}
                              className="p-1.5 rounded-md hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-900/80 transition"
                              title={t("users_delete_btn") || "Revoke access"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: CREATE USER */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{t("users_modal_create_title")}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                    {createAvatar ? (
                      <img src={createAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      ref={createFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAvatarUpload(e.target.files[0], setCreateAvatar);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => createFileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        {t("profile_upload_avatar_btn") || "Upload Photo"}
                      </button>
                      {createAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setCreateAvatar(null);
                            if (createFileInputRef.current) createFileInputRef.current.value = "";
                          }}
                          className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-900/80 transition"
                        >
                          {t("profile_remove_avatar_btn") || "Remove"}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">JPG, PNG max 2MB (Optional)</p>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_officer_name_label")}</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Lieutenant Karim Belkacem"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_officer_email_label")}</label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="officier.tizi@in9ad.dz"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_temp_password_label")}</label>
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••••••"
                    minLength={6}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_role_label")}</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  >
                    <option value="CIVIL_PROTECTION">{t("role_protection_civile")}</option>
                    <option value="FOREST_GUARD">{t("role_dgf")}</option>
                    <option value="ADMIN">{t("role_admin_centrale")}</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("profile_phone_label") || "Phone Number"}</label>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+213 550 12 34 56"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Unit / Org */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_unit_label")}</label>
                  <input
                    type="text"
                    value={createOrg}
                    onChange={(e) => setCreateOrg(e.target.value)}
                    placeholder="Unité Principale Tizi Ouzou"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-slate-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3.5 py-2 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                  >
                    {t("users_cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    {loading ? t("users_creating") : t("users_submit_create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT USER */}
        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{t("users_modal_edit_title") || "Edit User Account"}</span>
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleEditUser} className="space-y-4">
                {/* Avatar Upload */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                    {editAvatar ? (
                      <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleAvatarUpload(e.target.files[0], setEditAvatar);
                        }
                      }}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => editFileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      >
                        {t("profile_upload_avatar_btn") || "Upload Photo"}
                      </button>
                      {editAvatar && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAvatar(null);
                            if (editFileInputRef.current) editFileInputRef.current.value = "";
                          }}
                          className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-900/80 transition"
                        >
                          {t("profile_remove_avatar_btn") || "Remove"}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">JPG, PNG max 2MB</p>
                  </div>
                </div>

                {/* Email - STRICTLY LOCKED / DISABLED */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300 block">{t("users_officer_email_label")}</label>
                    <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{t("profile_email_locked_notice") || "Email cannot be changed."}</span>
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      value={selectedUser.email}
                      disabled
                      readOnly
                      className="w-full px-3 py-2 pr-8 bg-slate-950/70 border border-slate-800 rounded text-xs text-slate-400 cursor-not-allowed font-mono opacity-80 select-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_officer_name_label")}</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_role_label")}</label>
                  <select
                    value={editRole}
                    disabled={selectedUser.email.toLowerCase() === "admin@in9ad.dz"}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option value="CIVIL_PROTECTION">{t("role_protection_civile")}</option>
                    <option value="FOREST_GUARD">{t("role_dgf")}</option>
                    <option value="ADMIN">{t("role_admin_centrale")}</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("profile_phone_label") || "Phone Number"}</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+213 550 12 34 56"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Unit / Org */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_unit_label")}</label>
                  <input
                    type="text"
                    value={editOrg}
                    onChange={(e) => setEditOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Reset Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300 block">{t("users_reset_password_label") || "Reset Password (Optional)"}</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder={t("users_reset_password_placeholder") || "Leave blank to keep current password"}
                    minLength={6}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-3.5 py-2 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                  >
                    {t("users_cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition disabled:opacity-50"
                  >
                    {loading ? (t("saving") || "Saving...") : (t("users_submit_edit") || "Save Changes")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DELETE CONFIRMATION */}
        {isDeleteModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-lg border border-red-900 bg-slate-900 p-6 space-y-4 shadow-2xl animate-in fade-in duration-150">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">
                    {t("users_delete_modal_title") || "Revoke Account Access"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {t("users_delete_modal_confirm") || "Are you sure you want to delete this user? This action cannot be undone."}
                  </p>
                </div>
              </div>

              {/* User details summary */}
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="font-semibold text-slate-200">{selectedUser.name}</div>
                <div className="font-mono text-slate-400">{selectedUser.email}</div>
                <div className="text-[11px] text-slate-500">{selectedUser.organization}</div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-3.5 py-2 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/50 transition disabled:opacity-50"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{loading ? (t("deleting") || "Deleting...") : (t("users_confirm_delete_btn") || "Delete Account")}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGate>
  );
}
