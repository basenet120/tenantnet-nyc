import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { IMAGE_LIMITS } from "@/lib/constants";
import { getEnglishContent } from "@/lib/i18n";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buildingId = sessionBuildingId(session);

  const body = await request.json();
  const { postId, content, imageUrls, language } = body as {
    postId?: string;
    content?: string;
    imageUrls?: string[];
    language?: string;
  };

  if (!postId || !content) {
    return NextResponse.json(
      { error: "Missing required fields: postId, content" },
      { status: 400 },
    );
  }

  if (imageUrls && imageUrls.length > IMAGE_LIMITS.maxPerComment) {
    return NextResponse.json(
      { error: `Maximum ${IMAGE_LIMITS.maxPerComment} images per comment` },
      { status: 400 },
    );
  }

  // Verify post exists and belongs to session's building
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || (buildingId && post.buildingId !== buildingId)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const isAdmin = session.type === "admin";
  const lang = language || "en";

  const bodyContent = await getEnglishContent(content, lang);

  const comment = await prisma.comment.create({
    data: {
      postId,
      ...(isAdmin
        ? { adminId: session.adminId }
        : { unitId: session.unitId }),
      body: bodyContent.original,
      bodyEn: lang !== "en" ? bodyContent.english : null,
      language: lang,
      images:
        imageUrls && imageUrls.length > 0
          ? { create: imageUrls.map((url) => ({ url })) }
          : undefined,
    },
  });

  return NextResponse.json({ id: comment.id });
}
