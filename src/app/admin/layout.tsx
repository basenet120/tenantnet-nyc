import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // If not authenticated, render children without context (login page needs this)
  if (!session || session.type !== "admin") {
    return <>{children}</>;
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

  return (
    <div
      data-admin-role={session.role}
      data-admin-building={buildingName ?? ""}
    >
      {children}
    </div>
  );
}
