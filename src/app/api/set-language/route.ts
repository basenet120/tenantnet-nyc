import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SUPPORTED_LANGS, LANG_COOKIE, type LangCode } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = await request.json();
  const { lang } = body as { lang?: string };

  if (!lang || !(lang in SUPPORTED_LANGS)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  // Set cookie for all users (including non-authenticated)
  const cookieStore = await cookies();
  cookieStore.set({
    name: LANG_COOKIE,
    value: lang,
    httpOnly: false, // readable by client JS for RTL
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 365 * 24 * 60 * 60,
    path: "/",
  });

  // If authenticated unit, persist to DB
  const session = await getSession();
  if (session?.type === "unit") {
    await prisma.unit.update({
      where: { id: session.unitId },
      data: { language: lang },
    });
  }

  return NextResponse.json({ success: true, lang });
}
