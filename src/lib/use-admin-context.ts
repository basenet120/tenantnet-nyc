"use client";

import { useState, useEffect } from "react";

export function useAdminContext() {
  const [role, setRole] = useState("tenant_rep");
  const [buildingName, setBuildingName] = useState("");

  useEffect(() => {
    const el = document.querySelector("[data-admin-role]");
    if (el) {
      setRole(el.getAttribute("data-admin-role") ?? "tenant_rep");
      setBuildingName(el.getAttribute("data-admin-building") ?? "");
    }
  }, []);

  return { role, buildingName: buildingName || undefined };
}
