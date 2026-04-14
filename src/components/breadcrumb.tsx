"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./i18n-provider";
import { LanguagePicker } from "./language-picker";

export function Breadcrumb() {
  const { t } = useI18n();
  const pathname = usePathname();

  // Don't show on landing, login, register, admin login, or auth pages
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/admin/login" ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  const segments = buildBreadcrumb(pathname);

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-charcoal-light)]">
      <div className="max-w-5xl mx-auto px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[0.6875rem] font-display uppercase tracking-wider">
          {segments.map((seg, i) => (
            <span key={i} className="flex items-center gap-1.5 shrink-0">
              {i > 0 && (
                <span className="text-[var(--color-border-light)]" aria-hidden="true">/</span>
              )}
              {i < segments.length - 1 ? (
                <Link
                  href={seg.href}
                  className="text-[var(--color-text-secondary)] hover:text-offwhite transition-colors no-underline"
                >
                  {seg.label}
                </Link>
              ) : (
                <span className="text-terracotta">{seg.label}</span>
              )}
            </span>
          ))}
        </div>
        <LanguagePicker />
      </div>
    </div>
  );
}

type Segment = { href: string; label: string };

function buildBreadcrumb(pathname: string): Segment[] {
  // Admin routes
  if (pathname.startsWith("/admin")) {
    return buildAdminBreadcrumb(pathname);
  }

  // Tenant routes
  const crumbs: Segment[] = [
    { href: "/dashboard", label: "Dashboard" },
  ];

  if (pathname === "/dashboard") return crumbs;

  if (pathname.startsWith("/section/")) {
    const slug = pathname.split("/")[2];
    crumbs.push({ href: pathname, label: slug?.replace(/-/g, " ") ?? "Section" });
    return crumbs;
  }

  if (pathname.startsWith("/post/")) {
    crumbs.push({ href: pathname, label: "Post" });
    return crumbs;
  }

  const TENANT_ROUTES: Record<string, string> = {
    "/settings": "Settings",
    "/new-post": "New Post",
    "/send-report": "Send Report",
  };
  if (TENANT_ROUTES[pathname]) {
    crumbs.push({ href: pathname, label: TENANT_ROUTES[pathname] });
  }

  return crumbs;
}

function buildAdminBreadcrumb(pathname: string): Segment[] {
  // System admin routes
  if (pathname.startsWith("/admin/system")) {
    const crumbs: Segment[] = [
      { href: "/admin/system", label: "System" },
    ];

    if (pathname === "/admin/system") return crumbs;

    if (pathname === "/admin/system/buildings") {
      crumbs.push({ href: pathname, label: "Buildings" });
      return crumbs;
    }

    if (pathname.startsWith("/admin/system/buildings/")) {
      crumbs.push({ href: "/admin/system/buildings", label: "Buildings" });
      crumbs.push({ href: pathname, label: "Building" });
      return crumbs;
    }

    if (pathname === "/admin/system/signups") {
      crumbs.push({ href: pathname, label: "Signups" });
      return crumbs;
    }

    return crumbs;
  }

  // Building admin routes
  const crumbs: Segment[] = [
    { href: "/admin", label: "Admin" },
  ];

  if (pathname === "/admin") return crumbs;

  const ADMIN_ROUTES: Record<string, string> = {
    "/admin/units": "Units",
    "/admin/sections": "Sections",
    "/admin/moderation": "Moderation",
    "/admin/onboard": "Onboard",
  };

  if (ADMIN_ROUTES[pathname]) {
    crumbs.push({ href: pathname, label: ADMIN_ROUTES[pathname] });
  }

  return crumbs;
}
