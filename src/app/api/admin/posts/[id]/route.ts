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
  const { isPinned, status } = body as {
    isPinned?: boolean;
    status?: PostStatus;
  };

  const data: { isPinned?: boolean; status?: PostStatus } = {};
  if (typeof isPinned === "boolean") data.isPinned = isPinned;
  if (status && Object.values(PostStatus).includes(status)) data.status = status;

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  const post = await prisma.post.update({
    where: { id },
    data,
  });

  return NextResponse.json(post);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
