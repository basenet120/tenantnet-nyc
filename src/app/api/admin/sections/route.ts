import { NextRequest, NextResponse } from "next/server";
import { getSession, sessionBuildingId } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mgmt_rep cannot modify sections
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, name, description, hasIssueTracking, sortOrder } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const buildingId = sessionBuildingId(session);

  // Verify section belongs to building
  const existing = await prisma.section.findUnique({ where: { id } });
  if (!existing || (buildingId && existing.buildingId !== buildingId)) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (hasIssueTracking !== undefined) data.hasIssueTracking = hasIssueTracking;
  if (sortOrder !== undefined) data.sortOrder = sortOrder;

  const section = await prisma.section.update({
    where: { id },
    data,
  });

  return NextResponse.json(section);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // mgmt_rep cannot create sections
  if (session.role === "mgmt_rep") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buildingId = sessionBuildingId(session);
  if (!buildingId) {
    return NextResponse.json({ error: "No building context" }, { status: 400 });
  }

  const body = await request.json();
  const { name, slug, description, hasIssueTracking } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 },
    );
  }

  const maxResult = await prisma.section.aggregate({
    where: { buildingId },
    _max: { sortOrder: true },
  });
  const nextSortOrder = (maxResult._max.sortOrder ?? 0) + 1;

  const section = await prisma.section.create({
    data: {
      name,
      slug,
      buildingId,
      description: description ?? "",
      hasIssueTracking: hasIssueTracking ?? false,
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
