"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getStoredToken, getStoredUser } from "@/lib/auth";
import { useLanguage } from "@/context/LanguageContext";

export default function RootPage() {
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();

    if (token && user) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <Image
          src="/logo.png"
          alt="INKAD Emblem"
          width={72}
          height={72}
          className="w-16 h-16 object-contain animate-pulse"
          priority
        />
        <div className="flex items-center gap-2 text-slate-400 text-xs font-mono">
          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <span>{t("security_verification_loading") || "Verifying security credentials..."}</span>
        </div>
      </div>
    </div>
  );
}
