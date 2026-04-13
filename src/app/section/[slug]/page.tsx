import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { PostStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS = ["all", "reported", "acknowledged", "fixed", "unresolved"] as const;

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

  const { slug } = await params;
  const { status } = await searchParams;

  const section = await prisma.section.findUnique({
    where: { slug },
  });

  if (!section) {
    notFound();
  }

  const statusFilter =
    status && status !== "all" && Object.values(PostStatus).includes(status as PostStatus)
      ? (status as PostStatus)
      : undefined;

  const posts = await prisma.post.findMany({
    where: {
      sectionId: section.id,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    include: {
      section: true,
      unit: true,
      admin: true,
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
              {isAdmin ? "Tenant Manager" : `Unit ${session.unitLabel}`}
            </p>
          </div>
        </div>
      </header>

      <main className="container-narrow py-8">
        {/* Status filter pills */}
        {section.hasIssueTracking && (
          <div className="flex gap-2 overflow-x-auto pb-6">
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
                  {option}
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
          + New Post
        </Link>

        {/* Post list */}
        <div className="space-y-3">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[var(--color-text-secondary)] text-sm">
                No posts yet. Be the first to post!
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                body={post.body}
                authorLabel={
                  post.admin ? "Tenant Manager" : post.unit ? `Unit ${post.unit.label}` : "Unknown"
                }
                sectionName={post.section.name}
                status={post.status ?? null}
                isPinned={post.isPinned}
                createdAt={post.createdAt}
                commentCount={post._count.comments}
                imageCount={post._count.images}
                isAdmin={isAdmin}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
