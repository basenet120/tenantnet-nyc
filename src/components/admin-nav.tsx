import Link from "next/link";
import { ExitBuildingButton } from "./exit-building-button";
import { LanguagePicker } from "./language-picker";

const allNavItems = [
  { label: "Dashboard", href: "/admin", roles: ["system_admin", "tenant_rep", "mgmt_rep"] },
  { label: "Units", href: "/admin/units", roles: ["system_admin", "tenant_rep"] },
  { label: "Sections", href: "/admin/sections", roles: ["system_admin", "tenant_rep"] },
  { label: "Moderation", href: "/admin/moderation", roles: ["system_admin", "tenant_rep"] },
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
  const navItems = allNavItems.filter((item) => item.roles.includes(role));
  const isSystemAdminInBuilding = role === "system_admin" && buildingName;

  return (
    <div>
      {isSystemAdminInBuilding && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-[var(--color-terracotta)]/10 border-2 border-[var(--color-terracotta)]/30 mb-3">
          <p className="text-xs text-[var(--color-terracotta-light)]">
            <span className="font-display uppercase tracking-wider">System Admin</span>
            {" viewing "}
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
            {item.label}
          </Link>
        ))}
        <div className="ms-auto flex items-center gap-1">
          <LanguagePicker />
          {role === "system_admin" && !isSystemAdminInBuilding && (
            <Link
              href="/admin/system"
              className="px-5 py-3 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 text-offwhite-dim hover:text-offwhite -mb-[2px] border-b-[3px] border-b-transparent"
            >
              System
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
