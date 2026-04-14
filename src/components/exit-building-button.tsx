"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "./admin-i18n-provider";

export function ExitBuildingButton() {
  const router = useRouter();
  const { t } = useAdminI18n();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/admin/system/switch-building", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buildingId: null }),
    });
    if (res.ok) {
      router.push("/admin/system");
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs font-display uppercase tracking-wider text-terracotta-light hover:text-offwhite transition-colors disabled:opacity-50"
    >
      {loading ? t("admin_exiting") : t("admin_back_system")}
    </button>
  );
}
