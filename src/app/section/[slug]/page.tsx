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
  if (!session || session.type !== "unit") {
    redirect("/");
  }

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-gray-600 hover:text-gray-900"
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
            <h1 className="text-lg font-semibold text-gray-900">
              {section.name}
            </h1>
            <p className="text-sm text-gray-500">{session.unitLabel}</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Status filter pills (only for issue-tracking sections) */}
        {section.hasIssueTracking && (
          <div className="flex gap-2 overflow-x-auto pb-4">
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
                  className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize whitespace-nowrap ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-600"
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
          className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Post
        </Link>

        {/* Post list */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No posts yet. Be the first to post!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                body={post.body}
                authorLabel={
                  post.unit?.label ?? post.admin?.email ?? "Unknown"
                }
                sectionName={post.section.name}
                status={post.status ?? null}
                isPinned={post.isPinned}
                createdAt={post.createdAt}
                commentCount={post._count.comments}
                imageCount={post._count.images}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
