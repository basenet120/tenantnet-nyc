import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Units", href: "/admin/units" },
  { label: "Sections", href: "/admin/sections" },
  { label: "Moderation", href: "/admin/moderation" },
];

export default function AdminNav({ current }: { current: string }) {
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
    </nav>
  );
}
