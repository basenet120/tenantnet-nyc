import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SystemAdminNav from "@/components/system-admin-nav";
import { BuildingRecordsBrowser } from "@/components/building-records-browser";
import { EnterBuildingButton } from "@/components/enter-building-button";
import Link from "next/link";
import { getAdminStrings } from "@/lib/get-admin-strings";

export default async function BuildingDetailPage({
  params,
}: {
  params: Promise<{ buildingId: string }>;
}) {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    redirect("/admin/login");
  }

  const { buildingId } = await params;

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    include: {
      _count: { select: { units: true, posts: true, admins: true, sections: true } },
      admins: { select: { id: true, email: true, name: true, role: true, createdAt: true } },
      records: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!building) notFound();

  const recentPosts = await prisma.post.findMany({
    where: { buildingId },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { section: true, unit: true, admin: { select: { email: true, name: true } } },
  });

  const { t } = await getAdminStrings();

  return (
    <div className="container-wide py-8">
      <div className="mb-6">
        <p className="section-label border-b-0 mb-1">{t("system_title")}</p>
        <h1 className="text-3xl tracking-tight">{building.name}</h1>
      </div>

      <SystemAdminNav current="/admin/system/buildings" />

      {/* Quick Actions */}
      <div className="mt-6 flex gap-3">
        <EnterBuildingButton buildingId={building.id} target="admin" />
        <EnterBuildingButton buildingId={building.id} target="forum" />
      </div>

      {/* Building Info */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="card-dark">
          <h3 className="font-display text-sm uppercase tracking-widest text-terracotta mb-4">{t("building_info")}</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">{t("building_address")}</dt>
              <dd className="text-offwhite">{building.address}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">{t("building_borough")}</dt>
              <dd className="text-offwhite capitalize">{building.borough.replace("_", " ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">{t("building_zip")}</dt>
              <dd className="text-offwhite">{building.zip}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">{t("building_floors_units")}</dt>
              <dd className="text-offwhite">{building.floors} / {building.totalUnits}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-secondary)]">{t("building_type")}</dt>
              <dd className="text-offwhite capitalize">{building.buildingType.replace("_", " ")}</dd>
            </div>
            {building.block && (
              <div className="flex justify-between">
                <dt className="text-[var(--color-text-secondary)]">{t("building_ids")}</dt>
                <dd className="text-offwhite">{building.block} / {building.lot} / {building.bin}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="card-dark">
          <h3 className="font-display text-sm uppercase tracking-widest text-terracotta mb-4">{t("building_stats")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-display text-offwhite">{building._count.units}</p>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase">Units</p>
            </div>
            <div>
              <p className="text-2xl font-display text-offwhite">{building._count.posts}</p>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-display text-offwhite">{building._count.admins}</p>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase">Admins</p>
            </div>
            <div>
              <p className="text-2xl font-display text-offwhite">{building._count.sections}</p>
              <p className="text-xs text-[var(--color-text-secondary)] uppercase">Sections</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admins */}
      <div className="mt-8">
        <h2 className="section-label">{t("building_admins")}</h2>
        <ul className="divide-y divide-[var(--color-border)]">
          {building.admins.map((admin) => (
            <li key={admin.id} className="flex items-baseline justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-offwhite">
                  {admin.name || admin.email}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {admin.email} &middot; <span className="text-terracotta-light capitalize">{admin.role.replace("_", " ")}</span>
                </p>
              </div>
              <time className="text-xs text-[var(--color-text-secondary)]">
                {admin.createdAt.toLocaleDateString()}
              </time>
            </li>
          ))}
        </ul>
      </div>

      {/* NYC Records */}
      {building.records.length > 0 && (
        <div className="mt-8">
          <h2 className="section-label">{t("building_records")}</h2>
          <BuildingRecordsBrowser records={building.records} buildingId={building.id} />
        </div>
      )}

      {/* Recent Posts */}
      <div className="mt-8">
        <h2 className="section-label">{t("building_recent_posts")}</h2>
        {recentPosts.length === 0 ? (
          <p className="text-sm text-[var(--color-text-secondary)]">{t("admin_no_posts")}</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {recentPosts.map((post) => (
              <li key={post.id} className="flex items-baseline justify-between py-3">
                <div className="min-w-0">
                  <Link href={`/post/${post.id}`} className="text-sm font-semibold text-offwhite hover:text-terracotta truncate block">
                    {post.title}
                  </Link>
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
