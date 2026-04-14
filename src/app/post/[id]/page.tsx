import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/status-badge";
import { CommentForm } from "@/components/comment-form";
import { ModerationToolbar } from "@/components/moderation-toolbar";
import { TranslatedText } from "@/components/translated-text";
import { LanguagePicker } from "@/components/language-picker";
import { getLang } from "@/lib/get-lang";

function roleLabel(admin: { role: string; name: string | null }) {
  const tag = admin.role === "system_admin" ? "System Admin"
    : admin.role === "tenant_rep" ? "Tenant Rep"
    : admin.role === "mgmt_rep" ? "Mgmt Rep"
    : "Admin";
  return admin.name ? `${admin.name} (${tag})` : tag;
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) {
    redirect("/");
  }
  const isAdmin = session.type === "admin";
  const canModerate = isAdmin && session.role !== "mgmt_rep";

  const buildingId = sessionBuildingId(session);
  const lang = await getLang();
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      section: true,
      unit: true,
      admin: { select: { email: true, role: true, name: true } },
      images: { orderBy: { createdAt: "asc" } },
      comments: {
        include: {
          unit: true,
          admin: { select: { email: true, role: true, name: true } },
          images: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!post) notFound();

  // Verify post belongs to session's building
  if (buildingId && post.buildingId !== buildingId) notFound();

  // Check visibility: private posts only visible to author or admins
  if (post.visibility === "private" && !isAdmin) {
    if (session.type === "unit" && post.unitId !== session.unitId) notFound();
  }

  const authorLabelText = post.admin
    ? roleLabel(post.admin)
    : post.unit
      ? `Unit ${post.unit.label}`
      : "Unknown";

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="border-b-2 border-[var(--color-border)] px-4 py-5">
        <div className="container-narrow flex items-center gap-4">
          <Link
            href={`/section/${post.section.slug}`}
            className="text-[var(--color-text-secondary)] hover:text-offwhite transition-colors"
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
          <h1 className="font-display text-lg uppercase tracking-tight text-offwhite flex-1">
            {post.section.name}
          </h1>
          <LanguagePicker currentLang={lang} />
        </div>
      </header>

      <main className="container-narrow py-8">
        {/* Post */}
        <article className="card">
          <div className="mb-4">
            <TranslatedText
              as="h2"
              className="font-display text-xl sm:text-2xl uppercase leading-tight text-[var(--color-text-on-surface)]"
              text={post.titleEn || post.title}
              lang={lang}
              sourceType="post_title"
              sourceId={post.id}
            />
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-charcoal-lighter)]">
              <span className="font-semibold">{authorLabelText}</span>
              <span aria-hidden="true">|</span>
              <time dateTime={post.createdAt.toISOString()}>
                {post.createdAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              {post.isPinned && (
                <span className="badge badge-amber">Pinned</span>
              )}
              {post.status && <StatusBadge status={post.status} />}
              {post.visibility === "private" && (
                <span className="badge badge-muted flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Private
                </span>
              )}
            </div>
          </div>

          <TranslatedText
            as="div"
            className="text-sm text-[var(--color-text-on-surface)] whitespace-pre-wrap leading-relaxed"
            text={post.bodyEn || post.body}
            lang={lang}
            sourceType="post_body"
            sourceId={post.id}
          />

          {/* Post images */}
          {post.images.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-3">
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
                    className="h-24 w-24 border-2 border-[var(--color-border)] object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
        </article>

        {/* Moderation Toolbar (tenant_rep and system_admin only) */}
        {canModerate && (
          <ModerationToolbar
            postId={post.id}
            isPinned={post.isPinned}
            status={post.status}
            hasIssueTracking={post.section.hasIssueTracking}
          />
        )}

        {/* Comments */}
        <section className="mt-8">
          <h3 className="section-label">
            {post.comments.length}{" "}
            {post.comments.length === 1 ? "Comment" : "Comments"}
          </h3>

          {post.comments.length > 0 && (
            <div className="space-y-3 mb-8">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="card-dark"
                >
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] mb-2">
                    <span className="font-display uppercase tracking-wide text-offwhite">
                      {comment.admin ? roleLabel(comment.admin) : comment.unit ? `Unit ${comment.unit.label}` : "Unknown"}
                    </span>
                    <span aria-hidden="true">|</span>
                    <time dateTime={comment.createdAt.toISOString()}>
                      {comment.createdAt.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <TranslatedText
                    as="p"
                    className="text-sm text-offwhite whitespace-pre-wrap leading-relaxed"
                    text={comment.bodyEn || comment.body}
                    lang={lang}
                    sourceType="comment_body"
                    sourceId={comment.id}
                  />
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
                            className="h-20 w-20 border-2 border-[var(--color-border)] object-cover hover:opacity-80 transition-opacity"
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
