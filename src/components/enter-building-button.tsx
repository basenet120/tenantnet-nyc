"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "./admin-i18n-provider";

export function EnterBuildingButton({
  buildingId,
  target,
}: {
  buildingId: string;
  target: "admin" | "forum";
}) {
  const router = useRouter();
  const { t } = useAdminI18n();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/admin/system/switch-building", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ buildingId }),
    });
    if (res.ok) {
      router.push(target === "admin" ? "/admin" : "/dashboard");
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`btn ${target === "admin" ? "btn-primary" : "btn-outline"} disabled:opacity-50`}
    >
      {loading
        ? t("system_switching")
        : target === "admin"
          ? t("system_enter_building")
          : t("system_view_forum")}
    </button>
  );
}
