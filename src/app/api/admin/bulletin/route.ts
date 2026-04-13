import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, sessionBuildingId } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mgmt_rep cannot create bulletins
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buildingId = sessionBuildingId(session);
  if (!buildingId) {
    return NextResponse.json({ error: "No building context" }, { status: 400 });
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

  // Verify section belongs to building
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section || section.buildingId !== buildingId) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const post = await prisma.post.create({
    data: {
      title,
      body: content,
      sectionId,
      buildingId,
      adminId: session.adminId,
      isPinned: false,
    },
  });

  return NextResponse.json({ id: post.id });
}
