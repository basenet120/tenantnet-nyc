import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  const buildingId = session ? sessionBuildingId(session) : null;

  const sections = await prisma.section.findMany({
    where: buildingId ? { buildingId } : {},
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      hasIssueTracking: true,
    },
  });

  return NextResponse.json(sections);
}
