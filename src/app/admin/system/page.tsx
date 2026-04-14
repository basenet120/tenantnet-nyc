import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SystemAdminNav from "@/components/system-admin-nav";
import Link from "next/link";
import { getAdminStrings } from "@/lib/get-admin-strings";

export default async function SystemDashboardPage() {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    redirect("/admin/login");
  }

  const [buildingCount, totalPosts, pendingSignups, recentBuildings] = await Promise.all([
    prisma.building.count(),
    prisma.post.count(),
    prisma.buildingSignup.count({ where: { status: "pending" } }),
    prisma.building.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { units: true, posts: true, admins: true } } },
    }),
  ]);

  const { t } = await getAdminStrings();

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">{t("system_title")}</p>
        <h1 className="text-3xl tracking-tight">TENANTNET.NYC</h1>
      </div>

      <SystemAdminNav current="/admin/system" />

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card-dark border-l-[3px] border-l-terracotta">
          <p className="uppercase-label text-[var(--color-text-secondary)]">{t("system_buildings")}</p>
          <p className="mt-1 font-display text-3xl text-offwhite">{buildingCount}</p>
        </div>
        <div className="card-dark border-l-[3px] border-l-amber">
          <p className="uppercase-label text-[var(--color-text-secondary)]">{t("admin_total_posts")}</p>
          <p className="mt-1 font-display text-3xl text-offwhite">{totalPosts}</p>
        </div>
        <div className="card-dark border-l-[3px] border-l-sage">
          <p className="uppercase-label text-[var(--color-text-secondary)]">{t("system_pending")}</p>
          <p className="mt-1 font-display text-3xl text-offwhite">{pendingSignups}</p>
          {pendingSignups > 0 && (
            <Link href="/admin/system/signups" className="text-xs text-terracotta-light mt-1 block">
              {t("system_review")}
            </Link>
          )}
        </div>
      </div>

      {/* Recent Buildings */}
      <div className="mt-10">
        <h2 className="section-label">{t("system_recent")}</h2>
        {recentBuildings.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{t("system_no_buildings")}</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentBuildings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/admin/system/buildings/${b.id}`}
                  className="flex items-baseline justify-between py-3 no-underline hover:bg-[var(--color-charcoal-light)] -mx-2 px-2 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-offwhite truncate">{b.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {b._count.units} units &middot; {b._count.posts} posts &middot; {b._count.admins} admins
                    </p>
                  </div>
                  <time className="ms-4 shrink-0 text-xs text-[var(--color-text-secondary)]">
                    {b.createdAt.toLocaleDateString()}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {recentBuildings.length > 0 && (
          <Link
            href="/admin/system/buildings"
            className="mt-4 block text-sm text-terracotta-light hover:text-terracotta"
          >
            View all buildings &rarr;
          </Link>
        )}
      </div>
    </div>
  );
}
