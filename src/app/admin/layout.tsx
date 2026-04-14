import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminStrings } from "@/lib/get-admin-strings";
import { AdminI18nProvider } from "@/components/admin-i18n-provider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If not authenticated, render children without context (login page needs this)
  if (!session || session.type !== "admin") {
    const { strings, lang } = await getAdminStrings();
    return (
      <AdminI18nProvider strings={strings} lang={lang}>
        {children}
      </AdminI18nProvider>
    );
  }

  const buildingId = sessionBuildingId(session);
  let buildingName: string | null = null;
  if (buildingId) {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { name: true },
    });
    buildingName = building?.name ?? null;
  }

  const { strings, lang } = await getAdminStrings();

  return (
    <AdminI18nProvider strings={strings} lang={lang}>
      <div
        data-admin-role={session.role}
        data-admin-building={buildingName ?? ""}
      >
        {children}
      </div>
    </AdminI18nProvider>
  );
}
