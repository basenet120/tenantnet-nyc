"use client";

import Link from "next/link";
import { ExitBuildingButton } from "./exit-building-button";
import { useAdminI18n } from "./admin-i18n-provider";

const allNavItems = [
  { key: "building_dashboard" as const, href: "/admin", roles: ["system_admin", "tenant_rep", "mgmt_rep"] },
  { key: "building_units" as const, href: "/admin/units", roles: ["system_admin", "tenant_rep"] },
  { key: "building_sections" as const, href: "/admin/sections", roles: ["system_admin", "tenant_rep"] },
  { key: "building_moderation" as const, href: "/admin/moderation", roles: ["system_admin", "tenant_rep"] },
];

export default function AdminNav({
  current,
  role,
  buildingName,
}: {
  current: string;
  role: string;
  buildingName?: string;
}) {
  const { t } = useAdminI18n();
  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const isSystemAdminInBuilding = role === "system_admin" && buildingName;

  return (
    <div>
      {isSystemAdminInBuilding && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--color-terracotta)]/10 border-2 border-[var(--color-terracotta)]/30 mb-3">
          <p className="text-xs text-[var(--color-terracotta-light)]">
            <span className="font-display uppercase tracking-wider">{t("role_system_admin")}</span>
            {" "}{t("system_viewing")}{" "}
            <strong className="text-offwhite">{buildingName}</strong>
          </p>
          <ExitBuildingButton />
        </div>
      )}
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
        {role === "system_admin" && !isSystemAdminInBuilding && (
          <Link
            href="/admin/system"
            className="ms-auto px-5 py-3 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 text-offwhite-dim hover:text-offwhite -mb-[2px] border-b-[3px] border-b-transparent"
          >
            {t("nav_system")}
          </Link>
        )}
      </nav>
    </div>
  );
}
