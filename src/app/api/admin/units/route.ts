import { NextResponse } from "next/server";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buildingId = sessionBuildingId(session);

  const units = await prisma.unit.findMany({
    where: buildingId ? { buildingId } : {},
    orderBy: [{ floor: "asc" }, { letter: "asc" }],
    include: {
      _count: { select: { posts: true, comments: true } },
    },
  });

  return NextResponse.json(units);
}
