import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { IMAGE_LIMITS } from "@/lib/constants";
import { PostStatus } from "@/generated/prisma/client";
import { sendPostForwardEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buildingId = sessionBuildingId(session);
  if (!buildingId) {
    return NextResponse.json({ error: "No building context" }, { status: 400 });
  }

  const body = await request.json();
  const { title, sectionId, content, imageUrls, visibility } = body as {
    title?: string;
    sectionId?: string;
    content?: string;
    imageUrls?: string[];
    visibility?: "public" | "private";
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

  if (!section || section.buildingId !== buildingId) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const isAdmin = session.type === "admin";

  const post = await prisma.post.create({
    data: {
      title,
      body: content,
      sectionId,
      buildingId,
      visibility: visibility === "private" ? "private" : "public",
      ...(isAdmin
        ? { adminId: session.adminId }
        : { unitId: session.unitId }),
      status: !isAdmin && section.hasIssueTracking ? PostStatus.reported : null,
      images:
        imageUrls && imageUrls.length > 0
          ? { create: imageUrls.map((url) => ({ url })) }
          : undefined,
    },
  });

  // Auto-forward to admins who have it enabled (fire-and-forget)
  prisma.admin.findMany({
    where: {
      buildingId,
      autoForwardPosts: true,
    },
  }).then((admins) => {
    for (const admin of admins) {
      const forwardSections = admin.autoForwardSections as string[];
      if (forwardSections.length === 0 || forwardSections.includes(sectionId)) {
        sendPostForwardEmail(admin.email, post.title, section.name, buildingId);
      }
    }
  }).catch(() => {});

  return NextResponse.json({ id: post.id });
}
