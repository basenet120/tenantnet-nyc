import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const units = await prisma.unit.findMany({
    orderBy: [{ floor: "asc" }, { letter: "asc" }],
    include: {
      _count: { select: { posts: true, comments: true } },
    },
  });

  return NextResponse.json(units);
}
