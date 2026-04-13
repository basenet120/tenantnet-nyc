import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [buildings, posts, signups] = await Promise.all([
    prisma.building.count(),
    prisma.post.count(),
    prisma.buildingSignup.count({ where: { status: "pending" } }),
  ]);

  return NextResponse.json({ buildings, posts, pendingSignups: signups });
}
