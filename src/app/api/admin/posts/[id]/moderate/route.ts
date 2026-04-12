import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { PostStatus } from "@/generated/prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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
