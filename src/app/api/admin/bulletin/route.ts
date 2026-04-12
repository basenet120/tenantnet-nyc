import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, content, sectionId } = body as {
    title?: string;
    content?: string;
    sectionId?: string;
  };

  if (!title || !content || !sectionId) {
    return NextResponse.json(
      { error: "Missing required fields: title, content, sectionId" },
      { status: 400 },
    );
  }

  const post = await prisma.post.create({
    data: {
      title,
      body: content,
      sectionId,
      adminId: session.adminId,
      isPinned: false,
    },
  });

  return NextResponse.json({ id: post.id });
}
