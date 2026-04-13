import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({ where: { token: sessionToken } });
  }

  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ success: true });
}
