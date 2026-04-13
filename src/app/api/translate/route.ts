import { NextResponse } from "next/server";
import { translateCached, SUPPORTED_LANGS, type LangCode } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = await request.json();
  const { text, toLang, sourceType, sourceId } = body as {
    text?: string;
    toLang?: string;
    sourceType?: string;
    sourceId?: string;
  };

  if (!text || !toLang || !sourceType || !sourceId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!(toLang in SUPPORTED_LANGS)) {
    return NextResponse.json({ error: "Unsupported language" }, { status: 400 });
  }

  if (toLang === "en") {
    return NextResponse.json({ translated: text });
  }

  const translated = await translateCached(text, toLang as LangCode, sourceType, sourceId);
  return NextResponse.json({ translated });
}
