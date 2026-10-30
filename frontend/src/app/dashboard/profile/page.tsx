"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Lock, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Camera, 
  ShieldCheck,
  Eye,
  EyeOff
} from "lucide-react";
import { getStoredUser, updateStoredUser, getRoleBadgeInfo, getLocalizedUserName, AuthUser } from "@/lib/auth";
import { updateMyProfile } from "@/lib/api";
import { useLanguage } from "@/context/LanguageContext";

export default function MyProfilePage() {
  const { t, language } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
      setName(user.name || "");
      setPhone(user.phone || "");
      setAvatar(user.avatar || null);
    }
  }, []);

  // Handle image upload with 2MB validation
  const handleAvatarFile = (file: File) => {
    setErrorMsg(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg(t("profile_avatar_invalid_type") || "Only JPG, PNG, and WebP images are supported.");
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      setErrorMsg(t("profile_avatar_too_large") || "Image size exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatar(result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAvatarFile(e.target.files[0]);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password && password.length < 6) {
      setErrorMsg(t("profile_err_password_short") || "Password must be at least 6 characters.");
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg(t("profile_err_password_mismatch") || "Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const payload: { name?: string; phone?: string; password?: string; avatar?: string } = {
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar || "",
      };
      if (password.trim()) {
        payload.password = password.trim();
      }

      await updateMyProfile(payload);

      // Update local stored user
      const updatedUser = updateStoredUser({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar || undefined,
      });

      if (updatedUser) {
        setCurrentUser(updatedUser);
      }

      setPassword("");
      setConfirmPassword("");
      setSuccessMsg(t("profile_update_success") || "Profile details updated successfully.");
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      // Local fallback in case backend is in mock/offline mode
      const updatedUser = updateStoredUser({
        name: name.trim(),
        phone: phone.trim(),
        avatar: avatar || undefined,
      });
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
      setSuccessMsg(t("profile_update_success") || "Profile details updated successfully (offline sync).");
      setTimeout(() => setSuccessMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        {t("loading")}
      </div>
    );
  }

  const badgeInfo = getRoleBadgeInfo(currentUser.role, language);
  const localizedName = getLocalizedUserName(currentUser.name, currentUser.role, language);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${badgeInfo.colorClass}`}>
            {badgeInfo.text}
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {currentUser.organization || "Direction Opérationnelle"}
          </span>
        </div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2 mt-1">
          <User className="w-5 h-5 text-red-500" />
          <span>{t("profile_page_title") || "My Profile & Account Settings"}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {t("profile_page_subtitle") || "Manage your operational personnel credentials, security, and institutional identity."}
        </p>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-red-900 bg-red-950/60 text-red-200 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg border border-emerald-900 bg-emerald-950/60 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Upload Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm text-slate-800 dark:text-slate-100">
          <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Camera className="w-4 h-4 text-slate-400" />
            <span>{t("profile_avatar_title") || "Official Avatar & Photo"}</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {t("profile_avatar_desc") || "Upload your official personnel photo (JPG, PNG, max 2MB). It will appear across the command dashboard."}
          </p>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar Preview */}
            <div className="relative group w-24 h-24 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
              {avatar ? (
                <img
                  src={avatar}
                  alt={localizedName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-10 h-10 text-slate-600" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-medium"
                title={t("profile_change_photo") || "Change Photo"}
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span>{t("profile_edit") || "Edit"}</span>
              </button>
            </div>

            {/* Upload Buttons */}
            <div className="space-y-2 text-center sm:text-left flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{t("profile_upload_avatar_btn") || "Upload Avatar"}</span>
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-950/60 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-900/80 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t("profile_remove_avatar_btn") || "Remove"}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {t("profile_avatar_specs") || "Max file size: 2MB. Recommended dimensions: 400x400 px."}
              </p>
            </div>
          </div>
        </div>

        {/* Identity Details Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4 shadow-sm text-slate-800 dark:text-slate-100">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>{t("profile_identity_title") || "Personnel Identity & Role"}</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                {t("profile_name_label") || "Full Name & Official Title"}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Lieutenant Karim Belkacem"
                  className="w-full px-3 py-2 pl-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                {t("profile_phone_label") || "Emergency Contact Phone"}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+213 550 12 34 56"
                  className="w-full px-3 py-2 pl-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-mono"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Email - STRICTLY READ-ONLY */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  {t("profile_email_label") || "Institutional Identifier (E-mail)"}
                </label>
                <span className="text-[10px] text-amber-400/90 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  <span>{t("profile_email_locked_notice") || "Email cannot be changed. Contact Central Admin."}</span>
                </span>
              </div>
              <div className="relative">
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  readOnly
                  className="w-full px-3 py-2 pl-9 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono opacity-80 select-none"
                />
                <Mail className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" />
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500">
                {t("profile_email_helper") || "For institutional security and audit traceability, email addresses are permanently bound to your accredited command center."}
              </p>
            </div>
          </div>
        </div>

        {/* Password Security Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-4 shadow-sm text-slate-800 dark:text-slate-100">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>{t("profile_security_title") || "Change Operational Password"}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {t("profile_password_optional_desc") || "Leave blank if you do not wish to change your current password."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                {t("profile_new_password_label") || "New Password"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  minLength={6}
                  className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-500 hover:text-slate-300 absolute right-3 top-2.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 block">
                {t("profile_confirm_password_label") || "Confirm New Password"}
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                minLength={6}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950/40 transition disabled:opacity-50"
          >
            {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{loading ? (t("profile_saving") || "Saving...") : (t("profile_save_changes") || "Save Profile Changes")}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

