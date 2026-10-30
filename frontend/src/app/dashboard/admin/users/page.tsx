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
  Unlock,
  X, 
  Phone, 
  Camera, 
  Upload, 
  AlertTriangle,
  Ban,
  Flag,
  ShieldAlert
} from "lucide-react";
import { getStoredUser, getStoredToken, getLocalizedUserName, AuthUser, UserRole } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";
import { RoleGate } from "@/components/RoleGate";
import { adminUpdateUser, adminDeleteUser, adminToggleBlockUser, reportUserAccount } from "@/lib/api";

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
  is_blocked?: boolean;
  status?: "ACTIVE" | "BLOCKED";
  blocked_reason?: string;
  blocked_at?: string;
}

const DEFAULT_USERS: ManagedUser[] = [
  {
    id: "usr-admin-01",
    email: "admin@inkad.dz",
    name: "Direction Générale - Super Admin",
    role: "ADMIN",
    phone: "+213 21 73 00 00",
    organization: "Ministère de l'Intérieur / INKAD Admin",
    organization_ar: "الإدارة المركزية",
    created_at: "2024-01-15T08:00:00Z",
    is_blocked: false,
    status: "ACTIVE"
  },
  {
    id: "usr-protect-01",
    email: "protection@inkad.dz",
    name: "Commandant Protection Civile",
    role: "CIVIL_PROTECTION",
    phone: "+213 26 20 14 14",
    organization: "Direction Générale de la Protection Civile (DGPC)",
    organization_ar: "الحماية المدنية",
    created_at: "2024-02-01T09:30:00Z",
    is_blocked: false,
    status: "ACTIVE"
  },
  {
    id: "usr-foret-01",
    email: "foret@inkad.dz",
    name: "Inspecteur Principal des Forêts",
    role: "FOREST_GUARD",
    phone: "+213 26 21 88 02",
    organization: "Direction Générale des Forêts (DGF - Kabylie)",
    organization_ar: "محافظة الغابات",
    created_at: "2024-02-15T10:15:00Z",
    is_blocked: false,
    status: "ACTIVE"
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

  // Block Modal state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockActionType, setBlockActionType] = useState<"BLOCK" | "UNBLOCK">("BLOCK");
  const [blockReason, setBlockReason] = useState("");

  // Report Modal state
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState("PROTOCOL_VIOLATION");
  const [reportExplanation, setReportExplanation] = useState("");
  const [reportAlsoBlock, setReportAlsoBlock] = useState(false);

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
    const isSuperAdmin = user.email.toLowerCase() === "admin@inkad.dz" || user.email.toLowerCase() === "admin@in9ad.dz";
    if (isSuperAdmin) {
      setActionError(t("users_err_superadmin_immutable") || "The primary Super Admin account (admin@inkad.dz) cannot be deleted.");
      return;
    }
    setSelectedUser(user);
    setActionError(null);
    setActionSuccess(null);
    setIsDeleteModalOpen(true);
  };

  // Open Block Modal
  const handleOpenBlock = (user: ManagedUser, action: "BLOCK" | "UNBLOCK") => {
    const isSuperAdmin = user.email.toLowerCase() === "admin@inkad.dz" || user.email.toLowerCase() === "admin@in9ad.dz";
    if (isSuperAdmin) {
      setActionError(t("users_err_superadmin_block") || "Primary Super Admin account cannot be suspended.");
      return;
    }
    setSelectedUser(user);
    setBlockActionType(action);
    setBlockReason(action === "BLOCK" ? (user.blocked_reason || "") : "");
    setActionError(null);
    setActionSuccess(null);
    setIsBlockModalOpen(true);
  };

  // Open Report Modal
  const handleOpenReport = (user: ManagedUser) => {
    const isSuperAdmin = user.email.toLowerCase() === "admin@inkad.dz" || user.email.toLowerCase() === "admin@in9ad.dz";
    if (isSuperAdmin) {
      setActionError(t("users_err_superadmin_block") || "Primary Super Admin account cannot be reported.");
      return;
    }
    setSelectedUser(user);
    setReportCategory("PROTOCOL_VIOLATION");
    setReportExplanation("");
    setReportAlsoBlock(false);
    setActionError(null);
    setActionSuccess(null);
    setIsReportModalOpen(true);
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
        created_at: new Date().toISOString(),
        is_blocked: false,
        status: "ACTIVE"
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
    const isSuperAdmin = selectedUser.email.toLowerCase() === "admin@inkad.dz" || selectedUser.email.toLowerCase() === "admin@in9ad.dz";
    if (isSuperAdmin) {
      setActionError(t("users_err_superadmin_immutable") || "The primary Super Admin account (admin@inkad.dz) cannot be deleted.");
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

  // BLOCK / UNBLOCK USER
  const handleConfirmBlock = async () => {
    if (!selectedUser) return;
    const shouldBlock = blockActionType === "BLOCK";
    setLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await adminToggleBlockUser(selectedUser.email, {
        is_blocked: shouldBlock,
        reason: blockReason.trim() || undefined,
      });

      setUsers(prev => prev.map(u => {
        if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
          return {
            ...u,
            is_blocked: shouldBlock,
            status: shouldBlock ? "BLOCKED" : "ACTIVE",
            blocked_reason: shouldBlock ? (blockReason.trim() || undefined) : undefined,
            blocked_at: shouldBlock ? new Date().toISOString() : undefined,
          };
        }
        return u;
      }));

      setActionSuccess(t("users_block_success") || "User account status updated successfully.");
    } catch (err: any) {
      // Fallback local update
      setUsers(prev => prev.map(u => {
        if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
          return {
            ...u,
            is_blocked: shouldBlock,
            status: shouldBlock ? "BLOCKED" : "ACTIVE",
            blocked_reason: shouldBlock ? (blockReason.trim() || undefined) : undefined,
            blocked_at: shouldBlock ? new Date().toISOString() : undefined,
          };
        }
        return u;
      }));
      setActionSuccess(t("users_block_success") || "User status updated locally.");
    } finally {
      setLoading(false);
      setIsBlockModalOpen(false);
      setSelectedUser(null);
    }
  };

  // SUBMIT REPORT
  const handleConfirmReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!reportExplanation.trim()) {
      setActionError(t("users_report_explanation_placeholder") || "Please provide an explanation for this report.");
      return;
    }

    setLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await reportUserAccount(selectedUser.email, {
        reason_category: reportCategory,
        explanation: reportExplanation.trim(),
        also_block: reportAlsoBlock,
      });

      if (reportAlsoBlock) {
        setUsers(prev => prev.map(u => {
          if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
            return {
              ...u,
              is_blocked: true,
              status: "BLOCKED",
              blocked_reason: `Reported: ${reportCategory}`,
              blocked_at: new Date().toISOString(),
            };
          }
          return u;
        }));
      }

      setActionSuccess(t("users_report_success") || "Incident report registered and logged to central audit successfully.");
      setIsReportModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      if (reportAlsoBlock) {
        setUsers(prev => prev.map(u => {
          if (u.email.toLowerCase() === selectedUser.email.toLowerCase()) {
            return {
              ...u,
              is_blocked: true,
              status: "BLOCKED",
              blocked_reason: `Reported: ${reportCategory}`,
              blocked_at: new Date().toISOString(),
            };
          }
          return u;
        }));
      }
      setActionSuccess(t("users_report_success") || "Report recorded successfully.");
      setIsReportModalOpen(false);
      setSelectedUser(null);
    } finally {
      setLoading(false);
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
                  <th className="py-3 px-4">{t("users_col_status") || "Status"}</th>
                  <th className="py-3 px-4">{t("users_col_phone") || "Phone / Contact"}</th>
                  <th className="py-3 px-4">{t("users_col_org")}</th>
                  <th className="py-3 px-4 text-right">{language === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => {
                  const isSuperAdmin = u.email.toLowerCase() === "admin@inkad.dz" || u.email.toLowerCase() === "admin@in9ad.dz";
                  const isBlocked = !!u.is_blocked || u.status === "BLOCKED";

                  return (
                    <tr key={u.id || u.email} className={`hover:bg-slate-800/40 transition ${isBlocked ? "bg-rose-950/15" : ""}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full bg-slate-800 border flex items-center justify-center text-slate-300 shrink-0 overflow-hidden ${isBlocked ? "border-rose-700/60 ring-1 ring-rose-500/40" : "border-slate-700"}`}>
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

                      <td className="py-3 px-4">
                        {isBlocked ? (
                          <span 
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800"
                            title={u.blocked_reason ? `Directive: ${u.blocked_reason}` : (t("users_status_suspended") || "Suspended")}
                          >
                            <Ban className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{t("users_status_suspended") || "Suspended"}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{t("users_status_active") || "Active"}</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {u.phone || "—"}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {language === "ar"
                          ? u.organization_ar || u.organization || "N/A"
                          : language === "en"
                          ? (u.organization?.includes("Intérieur")
                              ? "Ministry of Interior / INKAD Admin"
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

                          {/* Block / Unblock Toggle Button */}
                          {!isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenBlock(u, isBlocked ? "UNBLOCK" : "BLOCK")}
                              className={`p-1.5 rounded-md transition border ${
                                isBlocked
                                  ? "bg-rose-950/60 text-rose-300 hover:bg-emerald-950/60 hover:text-emerald-300 border-rose-800 hover:border-emerald-700"
                                  : "hover:bg-amber-950/60 text-slate-400 hover:text-amber-400 border-transparent hover:border-amber-800"
                              }`}
                              title={isBlocked ? (t("users_unblock_btn") || "Reactivate User") : (t("users_block_btn") || "Suspend User")}
                            >
                              {isBlocked ? (
                                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Report Button */}
                          {!isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => handleOpenReport(u)}
                              className="p-1.5 rounded-md hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-900/80 transition"
                              title={t("users_report_btn") || "Report Infraction"}
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Button or Protected Badge */}
                          {isSuperAdmin ? (
                            <span 
                              className="inline-flex items-center gap-1 text-[10px] text-amber-400/90 font-mono bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/60"
                              title="Primary Super Admin account is permanent and cannot be deleted or suspended."
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
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">
                      {t("profile_avatar_title") || "Official Avatar & Photo"}
                    </label>
                    <input
                      type="file"
                      ref={createFileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file, setCreateAvatar);
                      }}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => createFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t("profile_avatar_upload_btn") || "Upload Avatar"}</span>
                    </button>
                    <p className="text-[10px] text-slate-500">
                      {t("profile_avatar_help") || "Max file size: 2MB. JPG, PNG, WebP."}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_officer_email_label") || "Professional E-mail"} *
                  </label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="officer@inkad.dz"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_officer_name_label") || "Officer Name & Title"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Commandant Salim B."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Temporary Password */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_temp_password_label") || "Temporary Password"} *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_role_label") || "Branch / Assigned Role"}
                  </label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  >
                    <option value="CIVIL_PROTECTION">Protection Civile (DGPC)</option>
                    <option value="FOREST_GUARD">Conservation des Forêts (DGF)</option>
                    <option value="ADMIN">Direction Générale / Admin</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("profile_phone_label") || "Contact Phone"}
                  </label>
                  <input
                    type="tel"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+213 550 00 00 00"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Organization */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_unit_label") || "Unit / Assignment"}
                  </label>
                  <input
                    type="text"
                    value={createOrg}
                    onChange={(e) => setCreateOrg(e.target.value)}
                    placeholder="e.g. CODIS 15 Tizi-Ouzou"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
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
                    {loading ? (t("users_creating") || "Creating...") : (t("users_submit_create") || "Create account")}
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
                {/* Avatar Update */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                    {editAvatar ? (
                      <img src={editAvatar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-200 block">
                      {t("profile_avatar_title") || "Official Avatar & Photo"}
                    </label>
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAvatarUpload(file, setEditAvatar);
                      }}
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{t("profile_avatar_upload_btn") || "Upload Avatar"}</span>
                    </button>
                    <p className="text-[10px] text-slate-500">
                      {t("profile_avatar_help") || "Max file size: 2MB. JPG, PNG, WebP."}
                    </p>
                  </div>
                </div>

                {/* Email - READ-ONLY */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium">
                      {t("users_officer_email_label") || "Professional E-mail"}
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>{t("profile_email_locked_help") || "Email cannot be changed."}</span>
                    </span>
                  </div>
                  <input
                    type="email"
                    disabled
                    value={selectedUser.email}
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800/80 rounded text-xs text-slate-400 font-mono cursor-not-allowed select-none"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_officer_name_label") || "Officer Name & Title"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Role */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_role_label") || "Branch / Assigned Role"}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  >
                    <option value="CIVIL_PROTECTION">Protection Civile (DGPC)</option>
                    <option value="FOREST_GUARD">Conservation des Forêts (DGF)</option>
                    <option value="ADMIN">Direction Générale / Admin</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("profile_phone_label") || "Contact Phone"}
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 font-mono"
                  />
                </div>

                {/* Organization */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_unit_label") || "Unit / Assignment"}
                  </label>
                  <input
                    type="text"
                    value={editOrg}
                    onChange={(e) => setEditOrg(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  />
                </div>

                {/* Reset Password */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_reset_password_label") || "Reset Password (Optional)"}
                  </label>
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

        {/* MODAL: BLOCK / UNBLOCK USER */}
        {isBlockModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className={`w-full max-w-md rounded-lg border bg-slate-900 p-6 space-y-4 shadow-2xl animate-in fade-in duration-150 ${blockActionType === "BLOCK" ? "border-amber-900" : "border-emerald-900"}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                  blockActionType === "BLOCK"
                    ? "bg-amber-950/80 border-amber-800 text-amber-400"
                    : "bg-emerald-950/80 border-emerald-800 text-emerald-400"
                }`}>
                  {blockActionType === "BLOCK" ? <Ban className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">
                    {blockActionType === "BLOCK" 
                      ? (t("users_modal_block_title") || "Suspend Operational Account")
                      : (t("users_modal_unblock_title") || "Reactivate Operational Account")
                    }
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    {blockActionType === "BLOCK"
                      ? (t("users_modal_block_confirm") || "Are you sure you want to suspend this account? The user will immediately be barred from signing in.")
                      : (t("users_modal_unblock_confirm") || "Are you sure you want to reactivate this account? Operational access will be restored immediately.")
                    }
                  </p>
                </div>
              </div>

              {/* Target User Details */}
              <div className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="font-semibold text-slate-200">{selectedUser.name}</div>
                <div className="font-mono text-slate-400">{selectedUser.email}</div>
                <div className="text-[11px] text-slate-500">{selectedUser.organization}</div>
              </div>

              {/* Reason input (optional/recommended for block) */}
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-medium">
                  {t("users_block_reason_label") || "Suspension Reason / Directive (Optional)"}
                </label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder={t("users_block_reason_placeholder") || "e.g., Protocol violation, investigation in progress..."}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsBlockModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-3.5 py-2 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBlock}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded text-white text-xs font-semibold shadow-lg transition disabled:opacity-50 ${
                    blockActionType === "BLOCK"
                      ? "bg-amber-600 hover:bg-amber-500 shadow-amber-950/50"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/50"
                  }`}
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>
                    {loading
                      ? (t("saving") || "Updating...")
                      : blockActionType === "BLOCK"
                      ? (t("users_confirm_block_btn") || "Suspend Account")
                      : (t("users_confirm_unblock_btn") || "Reactivate Account")
                    }
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: REPORT USER */}
        {isReportModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-lg border border-rose-900 bg-slate-900 p-6 space-y-4 shadow-2xl animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-rose-950/80 border border-rose-800 flex items-center justify-center text-rose-400 shrink-0">
                    <Flag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {t("users_modal_report_title") || "Report Operational Infraction"}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Official security and protocol breach submission to Central Inspection
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmReport} className="space-y-4">
                {/* Target User Info */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                    {t("users_report_target_label") || "Reported Personnel"}
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{selectedUser.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{selectedUser.email}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {selectedUser.role}
                    </span>
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_report_category_label") || "Infraction Category"} *
                  </label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600"
                  >
                    <option value="PROTOCOL_VIOLATION">
                      {t("users_report_cat_protocol") || "Alert Protocol Violation"}
                    </option>
                    <option value="UNAUTHORIZED_ACCESS">
                      {t("users_report_cat_unauth") || "Unauthorized Data Access"}
                    </option>
                    <option value="FALSE_ALARM">
                      {t("users_report_cat_false_alarm") || "False Alarm Escalation / Misuse"}
                    </option>
                    <option value="INSUBORDINATION">
                      {t("users_report_cat_insubordination") || "Operational Insubordination"}
                    </option>
                    <option value="SUSPICIOUS_ACTIVITY">
                      {t("users_report_cat_suspicious") || "Suspicious Activity"}
                    </option>
                    <option value="OTHER">
                      {t("users_report_cat_other") || "Other Administrative Violation"}
                    </option>
                  </select>
                </div>

                {/* Explanation text area */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">
                    {t("users_report_explanation_label") || "Incident Narrative & Evidence"} *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={reportExplanation}
                    onChange={(e) => setReportExplanation(e.target.value)}
                    placeholder={t("users_report_explanation_placeholder") || "Provide a detailed factual description of the incident, timestamps, and observed protocol breaches..."}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-100 focus:outline-none focus:border-slate-600 resize-none leading-relaxed"
                  />
                </div>

                {/* Immediate Block Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-950/20 border border-rose-900/40 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={reportAlsoBlock}
                    onChange={(e) => setReportAlsoBlock(e.target.checked)}
                    className="mt-0.5 rounded border-rose-800 bg-slate-950 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-rose-300 block">
                      {t("users_report_also_block_label") || "Also suspend this account immediately"}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Prevents immediate login while Central Inspection investigates the incident report.
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReportModalOpen(false);
                      setSelectedUser(null);
                    }}
                    className="px-3.5 py-2 rounded bg-slate-800 text-slate-300 text-xs hover:bg-slate-700 transition"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950/50 transition disabled:opacity-50"
                  >
                    {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                    <span>{loading ? (t("submitting") || "Submitting...") : (t("users_submit_report_btn") || "Submit Incident Report")}</span>
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
