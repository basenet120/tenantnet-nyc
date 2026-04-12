import Link from "next/link";

const navItems = [
  { label: "Dashboard", href: "/admin" },
  { label: "Units", href: "/admin/units" },
  { label: "Sections", href: "/admin/sections" },
  { label: "Moderation", href: "/admin/moderation" },
];

export default function AdminNav({ current }: { current: string }) {
  return (
    <nav className="flex gap-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            current === item.href
              ? "bg-gray-900 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
