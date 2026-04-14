"use client";

import { useState, useRef, useEffect } from "react";

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
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState(currentLang ?? "en");
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Auto-detect from cookie if no prop was provided
  useEffect(() => {
    if (!currentLang) {
      const match = document.cookie.match(/tn_lang=([a-z]{2})/);
      if (match?.[1]) setLang(match[1]);
    }
  }, [currentLang]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    const t = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  async function switchLang(code: string) {
    if (code === lang) {
      setOpen(false);
      return;
    }
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
      // Silently fail
    } finally {
      setSwitching(false);
      setOpen(false);
    }
  }

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[var(--color-text-secondary)] hover:text-offwhite transition-colors"
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
      </button>

      {open && (
        <div
          className="absolute top-full end-0 mt-1 border-2 border-[var(--color-border)] bg-[var(--color-charcoal)] shadow-lg min-w-[160px]"
          style={{ zIndex: 9999 }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => switchLang(l.code)}
              className={`w-full text-start px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                l.code === lang
                  ? "text-terracotta bg-[var(--color-charcoal-light)]"
                  : "text-offwhite hover:bg-[var(--color-charcoal-light)]"
              }`}
            >
              <span>{l.native}</span>
              <span className="text-[0.625rem] text-[var(--color-text-secondary)] uppercase">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
