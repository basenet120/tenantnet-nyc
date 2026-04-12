import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, description, hasIssueTracking, sortOrder } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
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

  const body = await request.json();
  const { name, slug, description, hasIssueTracking } = body;

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 },
    );
  }

  const maxResult = await prisma.section.aggregate({
    _max: { sortOrder: true },
  });
  const nextSortOrder = (maxResult._max.sortOrder ?? 0) + 1;

  const section = await prisma.section.create({
    data: {
      name,
      slug,
      description: description ?? "",
      hasIssueTracking: hasIssueTracking ?? false,
      sortOrder: nextSortOrder,
    },
  });

  return NextResponse.json(section, { status: 201 });
}
