"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ExitBuildingButton() {
  const router = useRouter();
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
      {loading ? "Exiting..." : "Back to System"}
    </button>
  );
}
