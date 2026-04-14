import Link from "next/link";
import { LanguagePicker } from "./language-picker";

const navItems = [
  { label: "Dashboard", href: "/admin/system" },
  { label: "Buildings", href: "/admin/system/buildings" },
  { label: "Signups", href: "/admin/system/signups" },
];

export default function SystemAdminNav({ current }: { current: string }) {
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
      <div className="ml-auto flex items-center gap-1">
        <LanguagePicker />
        <Link
          href="/admin/onboard"
          className="px-5 py-3 font-display text-[0.8125rem] tracking-[0.08em] uppercase no-underline transition-colors duration-150 text-terracotta hover:text-terracotta-light -mb-[2px] border-b-[3px] border-b-transparent"
        >
          + Onboard Building
        </Link>
      </div>
    </nav>
  );
}
