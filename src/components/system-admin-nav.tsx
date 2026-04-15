"use client";

import Link from "next/link";
import { useAdminI18n } from "./admin-i18n-provider";
import { BuildingSwitcher } from "./building-switcher";

const navItems = [
  { key: "system_dashboard" as const, href: "/admin/system" },
  { key: "system_buildings" as const, href: "/admin/system/buildings" },
  { key: "system_signups" as const, href: "/admin/system/signups" },
];

export default function SystemAdminNav({
  current,
  pendingSignups = 0,
}: {
  current: string;
  pendingSignups?: number;
}) {
  const { t } = useAdminI18n();
  return (
    <nav className="flex flex-wrap items-center gap-0 border-b-2 border-border">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`relative px-5 py-3 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 ${
            current === item.href
              ? "text-terracotta border-b-[3px] border-b-terracotta -mb-[2px]"
              : "text-offwhite-dim hover:text-offwhite -mb-[2px] border-b-[3px] border-b-transparent"
          }`}
        >
          {t(item.key)}
          {item.key === "system_signups" && pendingSignups > 0 && (
            <span className="ms-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-[0.625rem] font-bold bg-[var(--color-danger)] text-offwhite rounded-full">
              {pendingSignups}
            </span>
          )}
        </Link>
      ))}
      <div className="ms-auto flex items-center gap-2 py-1.5 pe-2">
        <BuildingSwitcher />
        <Link
          href="/admin/onboard"
          className="px-4 py-2 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 text-terracotta hover:text-terracotta-light border-2 border-terracotta hover:border-terracotta-light"
        >
          {t("system_onboard")}
        </Link>
      </div>
    </nav>
  );
}
