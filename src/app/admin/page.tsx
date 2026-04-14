import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import AdminNav from "@/components/admin-nav";
import { getAdminStrings } from "@/lib/get-admin-strings";

type RecentPost = {
  id: string;
  title: string;
  createdAt: Date;
  section: { name: string };
  unit: { label: string } | null;
  admin: { email: string; name: string | null; role: string } | null;
};

export default async function AdminDashboardPage() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    redirect("/admin/login");
  }

  // System admin with no building context goes to system dashboard
  const buildingId = sessionBuildingId(session);
  if (!buildingId) redirect("/admin/system");

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { name: true },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const bFilter = { buildingId };

  const [openIssues, postsToday, totalPosts, recentPosts] = await Promise.all([
    prisma.post.count({
      where: { ...bFilter, status: { in: ["reported", "acknowledged"] } },
    }),
    prisma.post.count({
      where: { ...bFilter, createdAt: { gte: todayStart } },
    }),
    prisma.post.count({ where: bFilter }),
    prisma.post.findMany({
      where: bFilter,
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { section: true, unit: true, admin: { select: { email: true, name: true, role: true } } },
    }) as Promise<RecentPost[]>,
  ]);

  const { t } = await getAdminStrings();

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">{t("admin_title")}</p>
        <h1 className="text-3xl tracking-tight">{building?.name ?? "TENANTNET.NYC"}</h1>
      </div>

      <AdminNav current="/admin" role={session.role} buildingName={session.role === "system_admin" ? building?.name ?? undefined : undefined} />

      {/* Stat Cards */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("admin_open_issues")} value={openIssues} accent="terracotta" />
        <StatCard label={t("admin_posts_today")} value={postsToday} accent="amber" />
        <StatCard label={t("admin_total_posts")} value={totalPosts} accent="sage" />
      </div>

      {/* Recent Activity */}
      <div className="mt-10">
        <h2 className="section-label">{t("admin_recent_activity")}</h2>

        {recentPosts.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{t("admin_no_posts")}</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentPosts.map((post: RecentPost) => (
              <li key={post.id} className="flex items-baseline justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-offwhite">
                    {post.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {post.unit?.label ?? post.admin?.name ?? post.admin?.email ?? "Unknown"} in{" "}
                    <span className="text-terracotta-light">{post.section.name}</span>
                  </p>
                </div>
                <time className="ml-4 shrink-0 text-xs text-[var(--color-text-secondary)]">
                  {post.createdAt.toLocaleDateString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "terracotta" | "amber" | "sage";
}) {
  const borderColors = {
    terracotta: "border-l-terracotta",
    amber: "border-l-amber",
    sage: "border-l-sage",
  };

  return (
    <div
      className={`card-dark border-l-[3px] ${borderColors[accent]}`}
    >
      <p className="uppercase-label text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-1 font-display text-3xl text-offwhite">{value}</p>
    </div>
  );
}
