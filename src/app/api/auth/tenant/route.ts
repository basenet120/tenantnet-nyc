import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createUnitSession, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 },
    );
  }

  const cleanUsername = username.trim().toLowerCase();

  const unit = await prisma.unit.findUnique({
    where: { username: cleanUsername },
  });

  if (!unit || !unit.isRegistered || !unit.passwordHash) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  const valid = await bcrypt.compare(password, unit.passwordHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  const token = await createUnitSession(unit.id);
  const cookieStore = await cookies();
  cookieStore.set(setSessionCookie(token));

  return NextResponse.json({ success: true });
}
