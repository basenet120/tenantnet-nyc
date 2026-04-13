import Link from "next/link";

const allNavItems = [
  { label: "Dashboard", href: "/admin", roles: ["system_admin", "tenant_rep", "mgmt_rep"] },
  { label: "Units", href: "/admin/units", roles: ["system_admin", "tenant_rep"] },
  { label: "Sections", href: "/admin/sections", roles: ["system_admin", "tenant_rep"] },
  { label: "Moderation", href: "/admin/moderation", roles: ["system_admin", "tenant_rep"] },
];

export default function AdminNav({ current, role }: { current: string; role: string }) {
  const navItems = allNavItems.filter((item) => item.roles.includes(role));

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
          {item.label}
        </Link>
      ))}
      {role === "system_admin" && (
        <Link
          href="/admin/system"
          className="ml-auto px-5 py-3 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 text-offwhite-dim hover:text-offwhite -mb-[2px] border-b-[3px] border-b-transparent"
        >
          System
        </Link>
      )}
    </nav>
  );
}
