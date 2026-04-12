import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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
