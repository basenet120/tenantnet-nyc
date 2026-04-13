import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { PostStatus } from "@/generated/prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mgmt_rep cannot moderate
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const buildingId = sessionBuildingId(session);

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing || (buildingId && existing.buildingId !== buildingId)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const body = await request.json();
  const { action, value } = body as { action?: string; value?: string | boolean };

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  switch (action) {
    case "pin": {
      const post = await prisma.post.update({
        where: { id },
        data: { isPinned: true },
      });
      return NextResponse.json(post);
    }

    case "unpin": {
      const post = await prisma.post.update({
        where: { id },
        data: { isPinned: false },
      });
      return NextResponse.json(post);
    }

    case "status": {
      if (!value || typeof value !== "string" || !Object.values(PostStatus).includes(value as PostStatus)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 },
        );
      }
      const post = await prisma.post.update({
        where: { id },
        data: { status: value as PostStatus },
      });
      return NextResponse.json(post);
    }

    case "delete": {
      await prisma.post.delete({ where: { id } });
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json(
        { error: "Unknown action. Valid actions: pin, unpin, status, delete" },
        { status: 400 },
      );
  }
}
