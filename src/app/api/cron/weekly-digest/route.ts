import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendWeeklyDigest } from "@/lib/email";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get all admins who want digest
  const admins = await prisma.admin.findMany({
    where: { notifyDigest: true, buildingId: { not: null } },
    select: { email: true, buildingId: true },
  });

  // Group by building
  const buildingAdmins = new Map<string, string[]>();
  for (const admin of admins) {
    if (!admin.buildingId) continue;
    const emails = buildingAdmins.get(admin.buildingId) || [];
    emails.push(admin.email);
    buildingAdmins.set(admin.buildingId, emails);
  }

  let sentCount = 0;

  for (const [buildingId, emails] of buildingAdmins) {
    const building = await prisma.building.findUnique({
      where: { id: buildingId },
      select: { name: true },
    });

    const posts = await prisma.post.findMany({
      where: { buildingId, createdAt: { gte: oneWeekAgo } },
      include: { section: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    for (const email of emails) {
      await sendWeeklyDigest(
        email,
        posts.map((p) => ({
          title: p.title,
          sectionName: p.section.name,
          createdAt: p.createdAt,
        })),
        building?.name ?? "Your Building",
      );
      sentCount++;
    }
  }

  return NextResponse.json({ sent: sentCount });
}
