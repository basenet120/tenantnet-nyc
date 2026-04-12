import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin-nav";

type RecentPost = {
  id: string;
  title: string;
  createdAt: Date;
  section: { name: string };
  unit: { label: string } | null;
  admin: { email: string } | null;
};

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    redirect("/admin/login");
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [openIssues, postsToday, totalPosts, recentPosts] = await Promise.all([
    prisma.post.count({
      where: { status: { in: ["reported", "acknowledged"] } },
    }),
    prisma.post.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.post.count(),
    prisma.post.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { section: true, unit: true, admin: true },
    }) as Promise<RecentPost[]>,
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">
        TENANTNET.NYC Admin
      </h1>

      <AdminNav current="/admin" />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open Issues" value={openIssues} />
        <StatCard label="Posts Today" value={postsToday} />
        <StatCard label="Total Posts" value={totalPosts} />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Recent Activity</h2>

      {recentPosts.length === 0 ? (
        <p className="text-sm text-gray-500">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {recentPosts.map((post: RecentPost) => (
            <li key={post.id} className="flex items-baseline justify-between py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">
                  {post.title}
                </p>
                <p className="text-xs text-gray-500">
                  {post.unit?.label ?? post.admin?.email ?? "Unknown"} in{" "}
                  {post.section.name}
                </p>
              </div>
              <time className="ml-4 shrink-0 text-xs text-gray-400">
                {post.createdAt.toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-5 py-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
