"use client";
import { createContext, useContext } from "react";
import type { AdminStrings } from "@/lib/get-admin-strings";

const AdminI18nContext = createContext<{ strings: AdminStrings; lang: string }>({
  strings: {} as AdminStrings,
  lang: "en",
});

export function AdminI18nProvider({ strings, lang, children }: { strings: AdminStrings; lang: string; children: React.ReactNode }) {
  return <AdminI18nContext.Provider value={{ strings, lang }}>{children}</AdminI18nContext.Provider>;
}

export function useAdminI18n() {
  const { strings, lang } = useContext(AdminI18nContext);
  const t = (key: keyof AdminStrings) => strings[key] ?? key;
  return { t, lang };
}
