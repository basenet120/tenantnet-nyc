import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createUnitSession, createAdminSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username or email and password are required" },
      { status: 400 },
    );
  }

  const identifier = username.trim().toLowerCase();
  const isEmail = identifier.includes("@");

  // Try tenant first
  const unit = isEmail
    ? await prisma.unit.findFirst({ where: { email: identifier } })
    : await prisma.unit.findUnique({ where: { username: identifier } });

  if (unit?.isRegistered && unit.passwordHash) {
    const valid = await bcrypt.compare(password, unit.passwordHash);
    if (valid) {
      const token = await createUnitSession(unit.id, unit.buildingId);
      const cookieStore = await cookies();
      cookieStore.set(setSessionCookie(token));
      return NextResponse.json({ success: true });
    }
  }

  // Try admin (email only)
  if (isEmail) {
    const admin = await prisma.admin.findUnique({ where: { email: identifier } });
    if (admin) {
      const valid = await bcrypt.compare(password, admin.passwordHash);
      if (valid) {
        const token = await createAdminSession(admin.id, admin.buildingId);
        const cookieStore = await cookies();
        cookieStore.set(setSessionCookie(token));
        return NextResponse.json({ success: true });
      }
    }
  }

  return NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 },
  );
}
