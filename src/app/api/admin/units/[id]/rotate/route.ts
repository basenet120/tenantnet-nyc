import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mgmt_rep cannot rotate QR codes
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const buildingId = sessionBuildingId(session);

  // Verify unit belongs to building
  const unit = await prisma.unit.findUnique({ where: { id } });
  if (!unit || (buildingId && unit.buildingId !== buildingId)) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  const newToken = randomBytes(16).toString("hex");

  await prisma.$transaction(async (tx) => {
    await tx.session.deleteMany({ where: { unitId: id } });
    await tx.unit.update({
      where: { id },
      data: { qrToken: newToken, qrTokenCreatedAt: new Date() },
    });
  });

  return NextResponse.json({ qrToken: newToken });
}
