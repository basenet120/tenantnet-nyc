import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SystemAdminNav from "@/components/system-admin-nav";
import Link from "next/link";
import { getAdminStrings } from "@/lib/get-admin-strings";

export default async function BuildingsListPage() {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    redirect("/admin/login");
  }

  const [buildings, pendingSignups] = await Promise.all([
    prisma.building.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { units: true, posts: true, admins: true } },
      },
    }),
    prisma.buildingSignup.count({ where: { status: "pending" } }),
  ]);

  const { t } = await getAdminStrings();

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">{t("system_title")}</p>
        <h1 className="text-3xl tracking-tight">{t("system_buildings")}</h1>
      </div>

      <SystemAdminNav current="/admin/system/buildings" pendingSignups={pendingSignups} />

      <div className="mt-8">
        {buildings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">{t("system_no_buildings")}</p>
            <Link href="/admin/onboard" className="btn btn-primary">{t("system_onboard")}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {buildings.map((b) => (
              <Link
                key={b.id}
                href={`/admin/system/buildings/${b.id}`}
                className="block card-dark no-underline hover:border-l-4 hover:border-l-terracotta transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-offwhite">{b.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {b.address} &middot; {b.borough.replace("_", " ")} &middot; {b.zip}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex gap-4 text-xs text-[var(--color-text-secondary)]">
                      <span>{b._count.units} units</span>
                      <span>{b._count.posts} posts</span>
                      <span>{b._count.admins} admins</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {b.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
