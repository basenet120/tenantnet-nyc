import { redirect } from "next/navigation";
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">TENANTNET.NYC</h1>
          <span className="text-sm text-gray-500">Unit {session.unitLabel}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Pinned Bulletins */}
        {pinnedBulletins.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Pinned Bulletins</h2>
            <div className="space-y-2">
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
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Your Open Issues</h2>
            <div className="space-y-2">
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
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Sections</h2>
          <SectionNav sections={sections} />
        </section>

        {/* Recent Posts */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent Posts</h2>
          <div className="space-y-2">
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
              <p className="text-sm text-gray-500 text-center py-8">No posts yet. Be the first to post!</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
