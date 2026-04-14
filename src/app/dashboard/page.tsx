import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PostCard } from "@/components/post-card";
import { SectionNav } from "@/components/section-nav";
import { BuildingRecordsBrowser } from "@/components/building-records-browser";
import { RentStabilizedNotice } from "@/components/rent-stabilized-notice";
import { postVisibilityWhere } from "@/lib/post-filters";
import { getAppStrings } from "@/lib/get-app-strings";

type PostWithRelations = {
  id: string;
  title: string;
  body: string;
  titleEn: string | null;
  bodyEn: string | null;
  isPinned: boolean;
  status: string | null;
  visibility: string;
  createdAt: Date;
  section: { name: string };
  unit: { label: string } | null;
  admin: { email: string; role: string; name: string | null } | null;
  _count: { comments: number; images: number };
};

function authorLabel(post: { admin: { email: string; role: string; name: string | null } | null; unit: { label: string } | null }) {
  if (post.admin) {
    const roleLabel = post.admin.role === "system_admin" ? "System Admin"
      : post.admin.role === "tenant_rep" ? "Tenant Rep"
      : post.admin.role === "mgmt_rep" ? "Mgmt Rep"
      : "Admin";
    return post.admin.name ? `${post.admin.name} (${roleLabel})` : roleLabel;
  }
  if (post.unit) return `Unit ${post.unit.label}`;
  return "Unknown";
}

function roleBadgeLabel(session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  if (session.type === "unit") return `Unit ${session.unitLabel}`;
  if (session.role === "system_admin") return "System Admin";
  if (session.role === "tenant_rep") return "Tenant Rep";
  if (session.role === "mgmt_rep") return "Mgmt Rep";
  return "Admin";
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) redirect("/");
  const isAdmin = session.type === "admin";
  if (!isAdmin && !session.isRegistered) redirect("/register");

  const buildingId = sessionBuildingId(session);
  if (!buildingId) redirect("/admin/system");

  const { t, lang, dir } = await getAppStrings();

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { name: true, address: true, buildingType: true },
  });

  const visibilityFilter = postVisibilityWhere(session);
  const buildingFilter = { buildingId };

  const [myIssues, recentPosts, pinnedBulletins, sections, records] = await Promise.all([
    isAdmin
      ? (Promise.resolve([]) as Promise<PostWithRelations[]>)
      : (prisma.post.findMany({
          where: { ...buildingFilter, unitId: session.unitId, status: { not: null } },
          include: { section: true, unit: true, admin: { select: { email: true, role: true, name: true } }, _count: { select: { comments: true, images: true } } },
          orderBy: { createdAt: "desc" },
          take: 5,
        }) as Promise<PostWithRelations[]>),
    prisma.post.findMany({
      where: { ...buildingFilter, ...visibilityFilter },
      include: { section: true, unit: true, admin: { select: { email: true, role: true, name: true } }, _count: { select: { comments: true, images: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }) as Promise<PostWithRelations[]>,
    prisma.post.findMany({
      where: { ...buildingFilter, isPinned: true, ...visibilityFilter },
      include: { section: true, unit: true, admin: { select: { email: true, role: true, name: true } }, _count: { select: { comments: true, images: true } } },
      orderBy: { createdAt: "desc" },
    }) as Promise<PostWithRelations[]>,
    prisma.section.findMany({ where: buildingFilter, orderBy: { sortOrder: "asc" } }),
    prisma.buildingRecord.findMany({ where: { buildingId }, orderBy: { createdAt: "asc" } }),
  ]);

  const isMgmtRep = isAdmin && session.role === "mgmt_rep";

  return (
    <div className="min-h-dvh" dir={dir}>
      {/* Header */}
      <header className="border-b-2 border-[var(--color-border)] px-4 py-5">
        <div className="container-narrow flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl uppercase tracking-tight text-offwhite">
              {building?.name ?? "Building"}
            </h1>
            <p className="text-xs uppercase tracking-[0.15em] text-[var(--color-text-secondary)] mt-0.5">
              {t("dashboard_tenantnet")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="btn btn-outline btn-sm no-underline"
                >
                  {t("dashboard_admin_panel")}
                </Link>
                <span className="badge badge-terracotta">{roleBadgeLabel(session)}</span>
              </>
            ) : (
              <span className="badge badge-terracotta">Unit {session.unitLabel}</span>
            )}
            <Link href="/send-report" className="btn btn-outline btn-sm no-underline">
              {t("dashboard_send_report")}
            </Link>
            {!isMgmtRep && (
              <Link href="/new-post" className="btn btn-primary btn-sm no-underline">
                {t("dashboard_new_post")}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="container-narrow py-8 space-y-10">
        {/* Pinned Bulletins */}
        {pinnedBulletins.length > 0 && (
          <section>
            <h2 className="section-label">{t("dashboard_pinned_bulletins")}</h2>
            <div className="space-y-3">
              {pinnedBulletins.map((post: PostWithRelations) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  titleEn={post.titleEn}
                  bodyEn={post.bodyEn}
                  authorLabel={authorLabel(post)}
                  sectionName={post.section.name}
                  status={post.status}
                  isPinned={post.isPinned}
                  visibility={post.visibility}
                  createdAt={post.createdAt}
                  commentCount={post._count.comments}
                  imageCount={post._count.images}
                  isAdmin={isAdmin}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        )}

        {/* NYC Building Records */}
        {records.length > 0 && (
          <section>
            <h2 className="section-label">{t("dashboard_nyc_records")}</h2>
            <BuildingRecordsBrowser records={records} />
          </section>
        )}

        {/* Your Open Issues */}
        {myIssues.length > 0 && (
          <section>
            <h2 className="section-label">{t("dashboard_your_issues")}</h2>
            <div className="space-y-3">
              {myIssues.map((post: PostWithRelations) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  body={post.body}
                  titleEn={post.titleEn}
                  bodyEn={post.bodyEn}
                  authorLabel={authorLabel(post)}
                  sectionName={post.section.name}
                  status={post.status}
                  isPinned={post.isPinned}
                  visibility={post.visibility}
                  createdAt={post.createdAt}
                  commentCount={post._count.comments}
                  imageCount={post._count.images}
                  isAdmin={isAdmin}
                  lang={lang}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sections */}
        <section>
          <h2 className="section-label">{t("dashboard_sections")}</h2>
          <SectionNav sections={sections} />
        </section>

        {/* Recent Posts */}
        <section>
          <h2 className="section-label">{t("dashboard_recent_posts")}</h2>
          <div className="space-y-3">
            {recentPosts.map((post: PostWithRelations) => (
              <PostCard
                key={post.id}
                id={post.id}
                title={post.title}
                body={post.body}
                titleEn={post.titleEn}
                bodyEn={post.bodyEn}
                authorLabel={authorLabel(post)}
                sectionName={post.section.name}
                status={post.status}
                isPinned={post.isPinned}
                visibility={post.visibility}
                createdAt={post.createdAt}
                commentCount={post._count.comments}
                imageCount={post._count.images}
                isAdmin={isAdmin}
                lang={lang}
              />
            ))}
            {recentPosts.length === 0 && (
              <p className="text-sm text-[var(--color-text-secondary)] text-center py-12">
                {t("dashboard_no_posts")}
              </p>
            )}
          </div>
        </section>
      </main>

      {/* Rent stabilization notice for tenants */}
      {!isAdmin && building?.buildingType && (
        <RentStabilizedNotice buildingType={building.buildingType} />
      )}
    </div>
  );
}
