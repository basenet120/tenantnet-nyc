import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { CommentForm } from "@/components/comment-form";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.type !== "unit") {
    redirect("/");
  }

  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      section: true,
      unit: true,
      admin: true,
      images: { orderBy: { createdAt: "asc" } },
      comments: {
        include: {
          unit: true,
          images: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const authorLabel = post.admin
    ? "Building Admin"
    : post.unit
      ? `Unit ${post.unit.label}`
      : "Unknown";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            href={`/section/${post.section.slug}`}
            className="text-gray-600 hover:text-gray-900"
            aria-label="Back to section"
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
          <h1 className="text-lg font-semibold text-gray-900">
            {post.section.name}
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Post */}
        <article className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-gray-900">
              {post.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>{authorLabel}</span>
              <span>&middot;</span>
              <time dateTime={post.createdAt.toISOString()}>
                {post.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              {post.isPinned && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Pinned
                </span>
              )}
              {post.status && <StatusBadge status={post.status} />}
            </div>
          </div>

          <div className="text-gray-800 text-sm whitespace-pre-wrap">
            {post.body}
          </div>

          {/* Post images */}
          {post.images.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3">
              {post.images.map((image) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={image.url}
                    alt=""
                    className="h-24 w-24 rounded-lg border border-gray-200 object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
        </article>

        {/* Comments */}
        <section className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {post.comments.length}{" "}
            {post.comments.length === 1 ? "Comment" : "Comments"}
          </h3>

          {post.comments.length > 0 && (
            <div className="space-y-4 mb-6">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-white border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="font-medium text-gray-700">
                      Unit {comment.unit.label}
                    </span>
                    <span>&middot;</span>
                    <time dateTime={comment.createdAt.toISOString()}>
                      {comment.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {comment.body}
                  </p>
                  {comment.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {comment.images.map((image) => (
                        <a
                          key={image.id}
                          href={image.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={image.url}
                            alt=""
                            className="h-20 w-20 rounded-lg border border-gray-200 object-cover hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <CommentForm postId={post.id} />
        </section>
      </main>
    </div>
  );
}
