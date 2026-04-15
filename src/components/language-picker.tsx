"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGES = [
  { code: "en", native: "English" },
  { code: "es", native: "Español" },
  { code: "zh", native: "中文" },
  { code: "ru", native: "Русский" },
  { code: "yi", native: "ייִדיש" },
  { code: "ar", native: "العربية" },
] as const;

const RTL_LANGS = ["yi", "ar"];

export function LanguagePicker({ currentLang }: { currentLang?: string }) {
  const [lang, setLang] = useState(currentLang ?? "en");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!currentLang) {
      const match = document.cookie.match(/tn_lang=([a-z]{2})/);
      if (match?.[1]) setLang(match[1]);
    }
  }, [currentLang]);

  async function switchLang(code: string) {
    if (code === lang) return;
    setSwitching(true);
    try {
      await fetch("/api/set-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang: code }),
      });
      setLang(code);
      document.documentElement.setAttribute("dir", RTL_LANGS.includes(code) ? "rtl" : "ltr");
      document.documentElement.setAttribute("lang", code);
      window.location.reload();
    } catch {
      setSwitching(false);
    }
  }

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={switching}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[var(--color-text-secondary)] hover:text-offwhite transition-colors outline-none"
        aria-label="Change language"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="text-xs font-display uppercase tracking-wider">
          {switching ? "..." : current.code.toUpperCase()}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => switchLang(l.code)}
            className={`flex items-center justify-between gap-4 ${
              l.code === lang ? "text-terracotta" : "text-offwhite"
            }`}
          >
            <span>{l.native}</span>
            <span className="text-[0.625rem] text-[var(--color-text-secondary)] uppercase">{l.code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
