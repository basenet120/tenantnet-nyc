import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendMgmtRepInvite } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only tenant_rep or system_admin can invite
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buildingId = sessionBuildingId(session);
  if (!buildingId) {
    return NextResponse.json({ error: "No building context" }, { status: 400 });
  }

  const body = await request.json();
  const { email, name } = body as { email?: string; name?: string };

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check if admin with this email already exists
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An admin with this email already exists" }, { status: 409 });
  }

  const tempPassword = randomBytes(8).toString("hex");
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const building = await prisma.building.findUnique({
    where: { id: buildingId },
    select: { name: true },
  });

  await prisma.admin.create({
    data: {
      email,
      passwordHash,
      role: "mgmt_rep",
      buildingId,
      name: name || null,
      invitedBy: session.adminId,
    },
  });

  // Send invite email (fire-and-forget)
  sendMgmtRepInvite(email, building?.name ?? "your building", tempPassword);

  return NextResponse.json({ success: true });
}
