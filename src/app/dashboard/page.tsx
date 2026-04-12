import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { SectionNav } from "@/components/section-nav";

type PostWithRelations = {
  id: string;
  title: string;
  body: string;
  isPinned: boolean;
  status: string | null;
  createdAt: Date;
  section: { name: string };
  unit: { label: string } | null;
  admin: { email: string } | null;
  _count: { comments: number; images: number };
};

function authorLabel(post: { admin: { email: string } | null; unit: { label: string } | null }) {
  if (post.admin) return "Building Admin";
  if (post.unit) return `Unit ${post.unit.label}`;
  return "Unknown";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || session.type !== "unit") redirect("/");
  if (!session.isRegistered) redirect("/register");

  const [myIssues, recentPosts, pinnedBulletins, sections] = await Promise.all([
    prisma.post.findMany({
      where: { unitId: session.unitId, status: { not: null } },
      include: { section: true, unit: true, admin: true, _count: { select: { comments: true, images: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }) as Promise<PostWithRelations[]>,
    prisma.post.findMany({
      where: {},
      include: { section: true, unit: true, admin: true, _count: { select: { comments: true, images: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }) as Promise<PostWithRelations[]>,
    prisma.post.findMany({
      where: { isPinned: true },
      include: { section: true, unit: true, admin: true, _count: { select: { comments: true, images: true } } },
      orderBy: { createdAt: "desc" },
    }) as Promise<PostWithRelations[]>,
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <header className="border-b-2 border-[var(--color-border)] px-4 py-5">
        <div className="container-narrow flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl uppercase tracking-tight text-offwhite">
              449 W 125th St
            </h1>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mt-0.5">
              Tenantnet.nyc
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-terracotta">Unit {session.unitLabel}</span>
            <Link href="/new-post" className="btn btn-primary btn-sm no-underline">
              + New Post
            </Link>
          </div>
        </div>
      </header>

      <main className="container-narrow py-8 space-y-10">
        {/* Pinned Bulletins */}
        {pinnedBulletins.length > 0 && (
          <section>
            <h2 className="section-label">Pinned Bulletins</h2>
            <div className="space-y-3">
              {pinnedBulletins.map((post: PostWithRelations) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  authorLabel={authorLabel(post)}
                  sectionName={post.section.name}
                  status={post.status}
                  isPinned={post.isPinned}
                  createdAt={post.createdAt}
                  commentCount={post._count.comments}
                  imageCount={post._count.images}
                />
              ))}
            </div>
          </section>
        )}

        {/* Your Open Issues */}
        {myIssues.length > 0 && (
          <section>
            <h2 className="section-label">Your Open Issues</h2>
            <div className="space-y-3">
              {myIssues.map((post: PostWithRelations) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  authorLabel={authorLabel(post)}
                  sectionName={post.section.name}
                  status={post.status}
                  isPinned={post.isPinned}
                  createdAt={post.createdAt}
                  commentCount={post._count.comments}
                  imageCount={post._count.images}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        <section>
          <h2 className="section-label">Sections</h2>
          <SectionNav sections={sections} />
        </section>

        {/* Recent Posts */}
        <section>
          <h2 className="section-label">Recent Posts</h2>
          <div className="space-y-3">
            {recentPosts.map((post: PostWithRelations) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                body={post.body}
                authorLabel={authorLabel(post)}
                sectionName={post.section.name}
                status={post.status}
                isPinned={post.isPinned}
                createdAt={post.createdAt}
                commentCount={post._count.comments}
                imageCount={post._count.images}
              />
            ))}
            {recentPosts.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-12">
                No posts yet. Be the first to post!
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
