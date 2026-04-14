import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/constants";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { buildingId } = await req.json();

  // Allow clearing building context (back to system view)
  if (buildingId === null) {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (token) {
      await prisma.session.update({
        where: { token },
        data: { buildingId: null },
      });
    }
    return NextResponse.json({ ok: true });
  }

  // Verify building exists
  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { id: true },
  });
  if (!building) {
    return NextResponse.json({ error: "Building not found" }, { status: 404 });
  }

  // Update session with building context
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.update({
      where: { token },
      data: { buildingId },
    });
  }

  return NextResponse.json({ ok: true });
}
