import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { prisma } from "./db";

export const SUPPORTED_LANGS = {
  en: { label: "English", native: "English", dir: "ltr" },
  es: { label: "Spanish", native: "Español", dir: "ltr" },
  zh: { label: "Chinese", native: "中文", dir: "ltr" },
  ru: { label: "Russian", native: "Русский", dir: "ltr" },
  yi: { label: "Yiddish", native: "ייִדיש", dir: "rtl" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl" },
} as const;

export type LangCode = keyof typeof SUPPORTED_LANGS;

export const RTL_LANGS: LangCode[] = ["yi", "ar"];

export const LANG_COOKIE = "tn_lang";

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[i18n] ANTHROPIC_API_KEY not set — translations unavailable");
    return null;
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Translate a single text string from one language to another.
 * Returns the translated text, or the original on failure.
 */
async function llmTranslate(
  text: string,
  fromLang: string,
  toLang: string,
): Promise<string> {
  const client = getClient();
  if (!client) return text;

  const fromName = SUPPORTED_LANGS[fromLang as LangCode]?.label ?? fromLang;
  const toName = SUPPORTED_LANGS[toLang as LangCode]?.label ?? toLang;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Translate the following text from ${fromName} to ${toName}.
Return ONLY the translated text, no explanations or quotes.
Keep proper nouns, unit numbers (e.g. "Unit 3B"), and technical terms unchanged.
Write natural, idiomatic ${toName}.

Text to translate:
${text}`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type === "text") return block.text.trim();
    return text;
  } catch (err) {
    console.error("[i18n] Translation failed:", err);
    return text;
  }
}

/**
 * Translate a JSON object of UI strings from English to target language.
 * Returns translated object with same keys.
 */
async function llmTranslateJson(
  strings: Record<string, string>,
  toLang: string,
): Promise<Record<string, string>> {
  const client = getClient();
  if (!client) return strings;

  const toName = SUPPORTED_LANGS[toLang as LangCode]?.label ?? toLang;
  const isRtl = RTL_LANGS.includes(toLang as LangCode);

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Translate the following JSON values from English to ${toName}.
Keep all JSON keys exactly as-is. Only translate the string values.
Write natural, idiomatic ${toName} for a software interface.
Brand names ("TENANTNET.NYC"), unit numbers ("Unit 3B"), and technical terms stay in English.
${isRtl ? "CRITICAL — RTL text rules: Do NOT insert invisible Unicode control characters (LRM, RLM). Do not reverse English brand names." : ""}
Return valid JSON only. No markdown fences, no explanation.

${JSON.stringify(strings, null, 2)}`,
        },
      ],
    });

    const block = response.content[0];
    if (block.type === "text") {
      let raw = block.text.trim();
      raw = raw.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
      const parsed = JSON.parse(raw);
      // Backfill missing keys with English
      for (const k of Object.keys(strings)) {
        if (!parsed[k]) parsed[k] = strings[k];
      }
      return parsed;
    }
    return strings;
  } catch (err) {
    console.error("[i18n] JSON translation failed:", err);
    return strings;
  }
}

// ─── Cached content translation ──────────────────────────

/**
 * Translate content with DB caching.
 * sourceType: "post_body", "post_title", "comment_body", "ui"
 * sourceId: post/comment ID or page name
 */
export async function translateCached(
  text: string,
  toLang: string,
  sourceType: string,
  sourceId: string,
): Promise<string> {
  if (toLang === "en") return text;
  if (!text.trim()) return text;

  const hash = hashContent(text);

  // Check cache
  const cached = await prisma.translation.findUnique({
    where: {
      lang_sourceType_sourceId_sourceHash: {
        lang: toLang,
        sourceType,
        sourceId,
        sourceHash: hash,
      },
    },
  });

  if (cached) return cached.content;

  // Generate translation
  const translated = await llmTranslate(text, "en", toLang);

  // Cache (upsert to handle race conditions)
  await prisma.translation.upsert({
    where: {
      lang_sourceType_sourceId_sourceHash: {
        lang: toLang,
        sourceType,
        sourceId,
        sourceHash: hash,
      },
    },
    update: {},
    create: {
      lang: toLang,
      sourceType,
      sourceId,
      sourceHash: hash,
      content: translated,
    },
  });

  return translated;
}

/**
 * Translate UI strings JSON with DB caching.
 */
export async function translateUiStrings(
  strings: Record<string, string>,
  toLang: string,
  page: string,
): Promise<Record<string, string>> {
  if (toLang === "en") return strings;

  const hash = hashContent(JSON.stringify(strings));

  const cached = await prisma.translation.findUnique({
    where: {
      lang_sourceType_sourceId_sourceHash: {
        lang: toLang,
        sourceType: "ui",
        sourceId: page,
        sourceHash: hash,
      },
    },
  });

  if (cached) {
    try {
      return JSON.parse(cached.content);
    } catch {
      // Corrupted cache, regenerate
    }
  }

  const translated = await llmTranslateJson(strings, toLang);

  await prisma.translation.upsert({
    where: {
      lang_sourceType_sourceId_sourceHash: {
        lang: toLang,
        sourceType: "ui",
        sourceId: page,
        sourceHash: hash,
      },
    },
    update: {},
    create: {
      lang: toLang,
      sourceType: "ui",
      sourceId: page,
      sourceHash: hash,
      content: JSON.stringify(translated),
    },
  });

  return translated;
}

/**
 * Translate user-authored content to English for storage.
 * Called when a user writes in a non-English language.
 */
export async function translateToEnglish(
  text: string,
  fromLang: string,
): Promise<string> {
  if (fromLang === "en") return text;
  return llmTranslate(text, fromLang, "en");
}

/**
 * Get the English version of content (for DB storage).
 * Returns { original, english } where english is the translated version.
 */
export async function getEnglishContent(
  text: string,
  lang: string,
): Promise<{ original: string; english: string }> {
  if (lang === "en") return { original: text, english: text };
  const english = await translateToEnglish(text, lang);
  return { original: text, english };
}
