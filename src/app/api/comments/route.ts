import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { IMAGE_LIMITS } from "@/lib/constants";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.type !== "unit" && session.type !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { postId, content, imageUrls } = body as {
    postId?: string;
    content?: string;
    imageUrls?: string[];
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

  // Verify post exists
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const isAdmin = session.type === "admin";

  const comment = await prisma.comment.create({
    data: {
      postId,
      ...(isAdmin
        ? { adminId: session.adminId }
        : { unitId: session.unitId }),
      body: content,
      images:
        imageUrls && imageUrls.length > 0
          ? { create: imageUrls.map((url) => ({ url })) }
          : undefined,
    },
  });

  return NextResponse.json({ id: comment.id });
}
