"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "./admin-i18n-provider";

type Building = {
  id: string;
  name: string;
  address: string;
  borough: string;
};

export function BuildingSwitcher() {
  const router = useRouter();
  const { t } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load buildings on first open
  useEffect(() => {
    if (!open || loaded) return;
    fetch("/api/admin/system/buildings-list")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Building[]) => {
        setBuildings(Array.isArray(data) ? data : []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [open, loaded]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  async function switchTo(buildingId: string) {
    setSwitching(true);
    try {
      const res = await fetch("/api/admin/system/switch-building", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buildingId }),
      });
      if (res.ok) {
        setOpen(false);
        router.push("/admin");
      }
    } finally {
      setSwitching(false);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = q
    ? buildings.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.address.toLowerCase().includes(q),
      )
    : buildings;

  return (
    <div ref={ref} className="relative" style={{ zIndex: 60 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={switching}
        className="flex items-center gap-2 px-3 py-2 font-display text-[0.6875rem] tracking-[0.08em] uppercase border-2 border-[var(--color-border)] text-offwhite-dim hover:text-offwhite hover:border-[var(--color-border-light)] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
        </svg>
        <span>{switching ? t("system_switching") : t("system_building_switcher")}</span>
      </button>

      {open && (
        <div
          className="absolute end-0 top-full mt-1 w-80 max-w-[calc(100vw-2rem)] border-2 border-[var(--color-border)] bg-[var(--color-charcoal)] shadow-lg"
          style={{ zIndex: 9999 }}
        >
          <div className="p-2 border-b border-[var(--color-border)]">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("system_building_switcher")}
              className="w-full px-2 py-1.5 text-sm bg-[var(--color-charcoal-light)] border border-[var(--color-border)] text-offwhite placeholder-[var(--color-text-secondary)] focus:outline-none focus:border-terracotta"
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {!loaded ? (
              <p className="text-xs text-[var(--color-text-secondary)] px-4 py-3 text-center">...</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-[var(--color-text-secondary)] px-4 py-3 text-center">
                {t("system_building_switcher_empty")}
              </p>
            ) : (
              filtered.map((b) => (
                <button
                  key={b.id}
                  onClick={() => switchTo(b.id)}
                  disabled={switching}
                  className="w-full text-start px-4 py-2.5 text-sm transition-colors text-offwhite hover:bg-[var(--color-charcoal-light)] disabled:opacity-50 border-b border-[var(--color-border)] last:border-b-0"
                >
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-[0.6875rem] text-[var(--color-text-secondary)] mt-0.5">
                    {b.address} · {b.borough.replace("_", " ")}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
