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
  if (post.admin) return "Tenant Manager";
  if (post.unit) return `Unit ${post.unit.label}`;
  return "Unknown";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) redirect("/");
  const isAdmin = session.type === "admin";
  if (!isAdmin && !session.isRegistered) redirect("/register");

  const [myIssues, recentPosts, pinnedBulletins, sections] = await Promise.all([
    isAdmin
      ? (Promise.resolve([]) as Promise<PostWithRelations[]>)
      : (prisma.post.findMany({
          where: { unitId: session.unitId, status: { not: null } },
          include: { section: true, unit: true, admin: true, _count: { select: { comments: true, images: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }) as Promise<PostWithRelations[]>),
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
            <Link
              href="/settings"
              className="hover:opacity-70 transition-opacity no-underline"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </Link>
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="btn btn-outline btn-sm no-underline"
                >
                  Admin Panel
                </Link>
                <span className="badge badge-terracotta">Tenant Manager</span>
              </>
            ) : (
              <span className="badge badge-terracotta">Unit {session.unitLabel}</span>
            )}
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
                  isAdmin={isAdmin}
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
                  isAdmin={isAdmin}
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
