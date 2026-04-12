import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed 17 units: 1A on floor 1, then 2A-2D through 5A-5D
  const units: { floor: number; letter: string }[] = [{ floor: 1, letter: "A" }];
  for (let floor = 2; floor <= 5; floor++) {
    for (const letter of ["A", "B", "C", "D"]) {
      units.push({ floor, letter });
    }
  }

  for (const unit of units) {
    const label = `${unit.floor}${unit.letter}`;
    await prisma.unit.upsert({
      where: { label },
      update: {},
      create: {
        floor: unit.floor,
        letter: unit.letter,
        label,
        qrToken: randomBytes(16).toString("hex"),
      },
    });
  }

  // Seed 5 default sections
  const sections = [
    { name: "Maintenance", slug: "maintenance", description: "Report and track maintenance issues", hasIssueTracking: true, sortOrder: 1 },
    { name: "Landlord Issues", slug: "landlord-issues", description: "Document landlord disputes and complaints", hasIssueTracking: true, sortOrder: 2 },
    { name: "Building Bulletins", slug: "bulletins", description: "Announcements, water shutoffs, events", hasIssueTracking: false, sortOrder: 3 },
    { name: "Community", slug: "community", description: "General discussion, selling, lending, recommendations", hasIssueTracking: false, sortOrder: 4 },
    { name: "Safety & Security", slug: "safety", description: "Door locks, suspicious activity, fire safety", hasIssueTracking: true, sortOrder: 5 },
  ];

  for (const section of sections) {
    await prisma.section.upsert({
      where: { slug: section.slug },
      update: {},
      create: section,
    });
  }

  // Seed admin account
  const adminEmail = process.env.ADMIN_EMAIL || "admin@tenantnet.nyc";
  const adminPassword = process.env.ADMIN_PASSWORD || "changeme";
  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hash,
    },
  });

  console.log("Seeded 17 units, 5 sections, 1 admin");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
