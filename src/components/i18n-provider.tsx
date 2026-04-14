"use client";

import { createContext, useContext } from "react";
import type { AppStrings } from "@/lib/get-app-strings";

const I18nContext = createContext<{ strings: AppStrings; lang: string }>({
  strings: {} as AppStrings,
  lang: "en",
});

export function I18nProvider({
  strings,
  lang,
  children,
}: {
  strings: AppStrings;
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ strings, lang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const { strings, lang } = useContext(I18nContext);
  const t = (key: keyof AppStrings) => strings[key] ?? key;
  return { t, lang };
}
