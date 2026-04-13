import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const signups = await prisma.buildingSignup.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(signups);
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.type !== "admin" || session.role !== "system_admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, status } = body as { id?: string; status?: string };

  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }

  const signup = await prisma.buildingSignup.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(signup);
}
