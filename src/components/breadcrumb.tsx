"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./i18n-provider";
import { LanguagePicker } from "./language-picker";

const ROUTE_LABELS: Record<string, string> = {
  "/dashboard": "nav_dashboard",
  "/settings": "settings_title",
  "/new-post": "new_post_title",
  "/send-report": "report_title",
};

export function Breadcrumb() {
  const { t } = useI18n();
  const pathname = usePathname();

  // Don't show on landing, login, register, admin, or auth pages
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  const segments = buildBreadcrumb(pathname, t);

  return (
    <div className="border-b border-[var(--color-border)] bg-[var(--color-charcoal-light)]">
      <div className="container-narrow px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[0.6875rem] font-display uppercase tracking-wider">
          {segments.map((seg, i) => (
            <span key={seg.href} className="flex items-center gap-1.5 shrink-0">
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

function buildBreadcrumb(
  pathname: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: any) => string,
): Segment[] {
  const crumbs: Segment[] = [
    { href: "/dashboard", label: t("nav_dashboard") },
  ];

  if (pathname === "/dashboard") return crumbs;

  // /section/[slug]
  if (pathname.startsWith("/section/")) {
    const slug = pathname.split("/")[2];
    crumbs.push({
      href: pathname,
      label: slug?.replace(/-/g, " ") ?? "Section",
    });
    return crumbs;
  }

  // /post/[id]
  if (pathname.startsWith("/post/")) {
    crumbs.push({ href: pathname, label: "Post" });
    return crumbs;
  }

  // Static routes
  const key = ROUTE_LABELS[pathname];
  if (key) {
    crumbs.push({ href: pathname, label: t(key) });
    return crumbs;
  }

  return crumbs;
}
