"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoredUser,
  getStoredToken,
  UserRole,
  RolePermissions,
  hasPermission,
} from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";

interface RoleGateProps {
  allowedRoles?: UserRole[];
  permission?: keyof RolePermissions;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  redirectTo?: string;
  showToast?: boolean;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  allowedRoles,
  permission,
  fallback,
  children,
  redirectTo,
  showToast = false,
}) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    const token = getStoredToken();

    if (!token || !user) {
      if (redirectTo) {
        router.replace(redirectTo);
      }
      setIsAuthorized(false);
      return;
    }

    let authorized = true;

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        authorized = false;
      }
    }

    if (permission) {
      if (!hasPermission(user.role, permission)) {
        authorized = false;
      }
    }

    if (!authorized) {
      setIsAuthorized(false);
      if (redirectTo) {
        if (showToast && typeof window !== "undefined") {
          sessionStorage.setItem(
            "inkad_auth_toast",
            JSON.stringify({
              title: t("unauthorized_access_title") || "Access Restricted",
              desc:
                t("unauthorized_access_desc") ||
                "Your operational profile does not have authorization to view this section.",
            })
          );
        }
        router.replace(redirectTo);
      }
    } else {
      setIsAuthorized(true);
    }
  }, [allowedRoles, permission, redirectTo, router, showToast, t]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span>{t("security_verification_loading") || "Verifying security credentials..."}</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;
    return null;
  }

  return <>{children}</>;
};

export default RoleGate;
