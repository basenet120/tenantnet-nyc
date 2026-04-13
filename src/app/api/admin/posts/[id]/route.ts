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

  // mgmt_rep cannot modify posts
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const buildingId = sessionBuildingId(session);

  // Verify post belongs to building
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing || (buildingId && existing.buildingId !== buildingId)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

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

  // mgmt_rep cannot delete posts
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const buildingId = sessionBuildingId(session);

  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing || (buildingId && existing.buildingId !== buildingId)) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
