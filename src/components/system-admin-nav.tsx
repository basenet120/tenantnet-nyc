"use client";

import Link from "next/link";
import { LanguagePicker } from "./language-picker";
import { useAdminI18n } from "./admin-i18n-provider";

const navItems = [
  { key: "admin_dashboard" as const, href: "/admin/system" },
  { key: "system_buildings" as const, href: "/admin/system/buildings" },
  { key: "system_signups" as const, href: "/admin/system/signups" },
];

export default function SystemAdminNav({ current }: { current: string }) {
  const { t } = useAdminI18n();
  return (
    <nav className="flex gap-0 border-b-2 border-border">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`px-5 py-3 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 ${
            current === item.href
              ? "text-terracotta border-b-[3px] border-b-terracotta -mb-[2px]"
              : "text-offwhite-dim hover:text-offwhite -mb-[2px] border-b-[3px] border-b-transparent"
          }`}
        >
          {t(item.key)}
        </Link>
      ))}
      <div className="ms-auto flex items-center gap-1">
        <LanguagePicker />
        <Link
          href="/admin/onboard"
          className="px-5 py-3 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 text-terracotta hover:text-terracotta-light -mb-[2px] border-b-[3px] border-b-transparent"
        >
          {t("system_onboard")}
        </Link>
      </div>
    </nav>
  );
}
