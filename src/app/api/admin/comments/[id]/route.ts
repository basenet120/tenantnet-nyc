import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mgmt_rep cannot delete comments
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const buildingId = sessionBuildingId(session);

  // Verify comment's post belongs to building
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { post: { select: { buildingId: true } } },
  });
  if (!comment || (buildingId && comment.post.buildingId !== buildingId)) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  await prisma.comment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
