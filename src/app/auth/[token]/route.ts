import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createUnitSession, setSessionCookie } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const unit = await prisma.unit.findUnique({
    where: { qrToken: token },
  });

  if (!unit) {
    const url = new URL("/auth/invalid", request.url);
    return NextResponse.redirect(url);
  }

  const sessionToken = await createUnitSession(unit.id, unit.buildingId);
  const cookie = setSessionCookie(sessionToken);

  // If not registered yet, redirect to registration
  const destination = unit.isRegistered ? "/dashboard" : "/register";
  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set(cookie);
  return response;
}
