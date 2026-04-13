import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      section: true,
      unit: { select: { id: true, label: true, firstName: true } },
      admin: { select: { id: true, email: true } },
    },
  });

  return NextResponse.json(posts);
}
