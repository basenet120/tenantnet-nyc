import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { PostStatus } from "@/generated/prisma/client";
import { postVisibilityWhere } from "@/lib/post-filters";
import { getAppStrings } from "@/lib/get-app-strings";

const STATUS_OPTIONS = ["all", "reported", "acknowledged", "fixed", "unresolved"] as const;

function authorLabel(post: { admin: { email: string; role: string; name: string | null } | null; unit: { label: string } | null }) {
  if (post.admin) {
    const roleLabel = post.admin.role === "system_admin" ? "System Admin"
      : post.admin.role === "tenant_rep" ? "Tenant Rep"
      : post.admin.role === "mgmt_rep" ? "Mgmt Rep"
      : "Admin";
    return post.admin.name ? `${post.admin.name} (${roleLabel})` : roleLabel;
  }
  if (post.unit) return `Unit ${post.unit.label}`;
  return "Unknown";
}

function roleBadgeLabel(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  if (session.type === "unit") return `Unit ${session.unitLabel}`;
  if (session.role === "system_admin") return "System Admin";
  if (session.role === "tenant_rep") return "Tenant Rep";
  if (session.role === "mgmt_rep") return "Mgmt Rep";
  return "Admin";
}

export default async function SectionFeedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) {
    redirect("/");
  }
  const isAdmin = session.type === "admin";

  const buildingId = sessionBuildingId(session);
  if (!buildingId) redirect("/admin/system");

  const { t, lang } = await getAppStrings();
  const { slug } = await params;
  const { status } = await searchParams;

  const section = await prisma.section.findUnique({
    where: { buildingId_slug: { buildingId, slug } },
  });

  if (!section) {
    notFound();
  }

  const statusFilter =
    status && status !== "all" && Object.values(PostStatus).includes(status as PostStatus)
      ? (status as PostStatus)
      : undefined;

  const visibilityFilter = postVisibilityWhere(session);

  const posts = await prisma.post.findMany({
    where: {
      sectionId: section.id,
      buildingId,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...visibilityFilter,
    },
    include: {
      section: true,
      unit: true,
      admin: { select: { email: true, role: true, name: true } },
      _count: { select: { comments: true, images: true } },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="border-b-2 border-[var(--color-border)] px-4 py-5">
        <div className="container-narrow flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-[var(--color-text-secondary)] hover:text-offwhite transition-colors"
            aria-label="Back to dashboard"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-2xl uppercase tracking-tight text-offwhite">
              {section.name}
            </h1>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mt-0.5">
              {roleBadgeLabel(session)}
            </p>
          </div>
        </div>
      </header>

      <main className="container-narrow py-8">
        {/* Status filter pills */}
        {section.hasIssueTracking && (
          <div className="flex flex-wrap gap-2 pb-6">
            {STATUS_OPTIONS.map((option) => {
              const isActive =
                option === "all"
                  ? !status || status === "all"
                  : status === option;
              return (
                <Link
                  key={option}
                  href={
                    option === "all"
                      ? `/section/${slug}`
                      : `/section/${slug}?status=${option}`
                  }
                  className={`px-4 py-2 text-xs font-display uppercase tracking-[0.08em] border-2 whitespace-nowrap no-underline transition-colors ${
                    isActive
                      ? "bg-terracotta border-terracotta text-offwhite"
                      : "bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-light)]"
                  }`}
                >
                  {t(`section_${option}` as "section_all" | "section_reported" | "section_acknowledged" | "section_fixed" | "section_unresolved")}
                </Link>
              );
            })}
          </div>
        )}

        {/* New Post button */}
        <Link
          href={`/new-post?section=${slug}`}
          className="btn btn-primary w-full mb-8 no-underline"
        >
          {t("section_new_post")}
        </Link>

        {/* Post list */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--color-text-secondary)] text-sm">
                {t("section_no_posts")}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                body={post.body}
                titleEn={post.titleEn}
                bodyEn={post.bodyEn}
                authorLabel={authorLabel(post)}
                sectionName={post.section.name}
                status={post.status ?? null}
                isPinned={post.isPinned}
                visibility={post.visibility}
                createdAt={post.createdAt}
                commentCount={post._count.comments}
                imageCount={post._count.images}
                isAdmin={isAdmin}
                lang={lang}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
