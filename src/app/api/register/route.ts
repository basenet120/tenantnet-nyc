import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "unit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { firstName, lastName, email, username, phone } = body as {
    firstName: string;
    lastName?: string;
    email: string;
    username: string;
    phone?: string;
  };

  // Validate required fields
  if (!firstName?.trim() || !email?.trim() || !username?.trim()) {
    return NextResponse.json(
      { error: "First name, email, and username are required" },
      { status: 400 },
    );
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  // Validate username: lowercase alphanumeric + underscores, 3-20 chars
  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters, lowercase letters, numbers, and underscores only" },
      { status: 400 },
    );
  }

  // Check username uniqueness
  const existing = await prisma.unit.findUnique({ where: { username: cleanUsername } });
  if (existing && existing.id !== session.unitId) {
    return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
  }

  await prisma.unit.update({
    where: { id: session.unitId },
    data: {
      firstName: firstName.trim(),
      lastName: lastName?.trim() || null,
      email: email.trim(),
      username: cleanUsername,
      phone: phone?.trim() || null,
      isRegistered: true,
    },
  });

  return NextResponse.json({ success: true });
}
