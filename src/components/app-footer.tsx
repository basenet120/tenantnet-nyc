"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./i18n-provider";

export function AppFooter() {
  const { t } = useI18n();
  const pathname = usePathname();

  // Don't show on landing, login, register, admin login, or auth pages
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/login" ||
    pathname.startsWith("/auth/")
  ) {
    return null;
  }

  const isAdmin = pathname.startsWith("/admin");
  const isSystem = pathname.startsWith("/admin/system");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tt = t as (key: any) => string;
  const navItems = isAdmin ? getAdminNav(isSystem, tt) : getTenantNav(tt);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t-2 border-[var(--color-border)] bg-[var(--color-charcoal)]">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2.5 px-4 no-underline transition-colors ${
                isActive
                  ? "text-terracotta"
                  : "text-[var(--color-text-secondary)] hover:text-offwhite"
              }`}
            >
              {item.icon}
              <span className="text-[0.5625rem] font-display uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

type NavItem = { href: string; label: string; icon: React.ReactNode };

function getTenantNav(t: (key: string) => string): NavItem[] {
  return [
    {
      href: "/dashboard",
      label: t("nav_dashboard"),
      icon: <HomeIcon />,
    },
    {
      href: "/new-post",
      label: t("footer_new_post"),
      icon: <PlusIcon />,
    },
    {
      href: "/settings",
      label: t("footer_settings"),
      icon: <SettingsIcon />,
    },
  ];
}

function getAdminNav(isSystem: boolean, t: (key: string) => string): NavItem[] {
  if (isSystem) {
    return [
      { href: "/admin/system", label: t("nav_dashboard"), icon: <HomeIcon /> },
      { href: "/admin/system/buildings", label: t("breadcrumb_buildings"), icon: <BuildingIcon /> },
      { href: "/admin/system/signups", label: t("breadcrumb_signups"), icon: <InboxIcon /> },
      { href: "/settings", label: t("footer_settings"), icon: <SettingsIcon /> },
    ];
  }
  return [
    { href: "/admin", label: t("nav_dashboard"), icon: <HomeIcon /> },
    { href: "/admin/moderation", label: t("breadcrumb_moderation"), icon: <ShieldIcon /> },
    { href: "/admin/units", label: t("breadcrumb_units"), icon: <GridIcon /> },
    { href: "/settings", label: t("footer_settings"), icon: <SettingsIcon /> },
  ];
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  );
}
