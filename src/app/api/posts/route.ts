import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { IMAGE_LIMITS } from "@/lib/constants";
import { PostStatus } from "@/generated/prisma/client";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, sectionId, content, imageUrls } = body as {
    title?: string;
    sectionId?: string;
    content?: string;
    imageUrls?: string[];
  };

  if (!title || !sectionId || !content) {
    return NextResponse.json(
      { error: "Missing required fields: title, sectionId, content" },
      { status: 400 },
    );
  }

  if (imageUrls && imageUrls.length > IMAGE_LIMITS.maxPerPost) {
    return NextResponse.json(
      { error: `Maximum ${IMAGE_LIMITS.maxPerPost} images per post` },
      { status: 400 },
    );
  }

  const section = await prisma.section.findUnique({
    where: { id: sectionId },
  });

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const isAdmin = session.type === "admin";

  const post = await prisma.post.create({
    data: {
      title,
      body: content,
      sectionId,
      ...(isAdmin
        ? { adminId: session.adminId }
        : { unitId: session.unitId }),
      // Admin posts are informational — no auto-reported status
      status: !isAdmin && section.hasIssueTracking ? PostStatus.reported : null,
      images:
        imageUrls && imageUrls.length > 0
          ? { create: imageUrls.map((url) => ({ url })) }
          : undefined,
    },
  });

  return NextResponse.json({ id: post.id });
}
