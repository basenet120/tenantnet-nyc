import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET current user settings
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.type === "admin") {
    const admin = await prisma.admin.findUnique({
      where: { id: session.adminId },
      select: {
        email: true,
        name: true,
        role: true,
      },
    });
    return NextResponse.json({
      type: "admin",
      firstName: admin?.name || null,
      lastName: null,
      email: admin?.email || null,
      username: null,
      phone: null,
      label: admin?.role || "admin",
      role: admin?.role,
      notifyNewPosts: false,
      notifyComments: false,
      notifyStatusChange: false,
      notifyBulletins: false,
    });
  }

  const unit = await prisma.unit.findUnique({
    where: { id: session.unitId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      username: true,
      phone: true,
      label: true,
      notifyNewPosts: true,
      notifyComments: true,
      notifyStatusChange: true,
      notifyBulletins: true,
    },
  });

  return NextResponse.json({ type: "unit", ...unit });
}

// PATCH update settings
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.type !== "unit") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    firstName,
    lastName,
    email,
    username,
    phone,
    currentPassword,
    newPassword,
    notifyNewPosts,
    notifyComments,
    notifyStatusChange,
    notifyBulletins,
  } = body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    username?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
    notifyNewPosts?: boolean;
    notifyComments?: boolean;
    notifyStatusChange?: boolean;
    notifyBulletins?: boolean;
  };

  const data: Record<string, unknown> = {};

  // Profile updates
  if (firstName !== undefined) {
    if (!firstName.trim()) {
      return NextResponse.json({ error: "First name cannot be empty" }, { status: 400 });
    }
    data.firstName = firstName.trim();
  }

  if (lastName !== undefined) data.lastName = lastName.trim() || null;
  if (phone !== undefined) data.phone = phone.trim() || null;

  if (email !== undefined) {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    const existingEmail = await prisma.unit.findFirst({ where: { email: email.trim().toLowerCase() } });
    if (existingEmail && existingEmail.id !== session.unitId) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 409 });
    }
    data.email = email.trim();
  }

  if (username !== undefined) {
    const clean = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters, lowercase letters, numbers, underscores" },
        { status: 400 },
      );
    }
    const existing = await prisma.unit.findUnique({ where: { username: clean } });
    if (existing && existing.id !== session.unitId) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
    data.username = clean;
  }

  // Password change
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new password" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    }

    const unit = await prisma.unit.findUnique({ where: { id: session.unitId } });
    if (!unit?.passwordHash || !(await bcrypt.compare(currentPassword, unit.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    data.passwordHash = await bcrypt.hash(newPassword, 12);
  }

  // Notification preferences
  if (notifyNewPosts !== undefined) data.notifyNewPosts = notifyNewPosts;
  if (notifyComments !== undefined) data.notifyComments = notifyComments;
  if (notifyStatusChange !== undefined) data.notifyStatusChange = notifyStatusChange;
  if (notifyBulletins !== undefined) data.notifyBulletins = notifyBulletins;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  await prisma.unit.update({
    where: { id: session.unitId },
    data,
  });

  return NextResponse.json({ success: true });
}
