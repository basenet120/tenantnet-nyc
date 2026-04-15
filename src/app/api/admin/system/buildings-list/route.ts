import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Lightweight list of all buildings, for the system admin building switcher.
 * Returns only what the switcher needs (id, name, address).
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buildings = await prisma.building.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      borough: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(buildings);
}
