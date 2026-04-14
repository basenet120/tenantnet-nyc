"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EnterBuildingButton({
  buildingId,
  target,
}: {
  buildingId: string;
  target: "admin" | "forum";
}) {
  const router = useRouter();
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
        ? "Switching..."
        : target === "admin"
          ? "Enter Admin Panel"
          : "View Forum"}
    </button>
  );
}
