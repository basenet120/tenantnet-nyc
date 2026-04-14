import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const LANGS = ["es", "zh", "ru", "yi", "ar"] as const;
const LANG_NAMES: Record<string, string> = {
  es: "Spanish", zh: "Simplified Chinese", ru: "Russian", yi: "Yiddish", ar: "Arabic",
};
const RTL_LANGS = ["yi", "ar"];

function hash(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

const CHUNK_SIZE = 50;

async function translateJsonChunk(
  strings: Record<string, string>,
  toLang: string,
): Promise<Record<string, string>> {
  const toName = LANG_NAMES[toLang];
  const isRtl = RTL_LANGS.includes(toLang);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Translate the following JSON values from English to ${toName}.
Keep all JSON keys exactly as-is. Only translate the string values.
Write natural, idiomatic ${toName} for a software interface.
Brand names ("TENANTNET.NYC"), unit numbers ("Unit 3B"), technical terms, and email addresses stay in English.
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
    try {
      const parsed = JSON.parse(raw);
      for (const k of Object.keys(strings)) {
        if (!parsed[k]) parsed[k] = strings[k];
      }
      return parsed;
    } catch {
      console.warn(`  [warn] JSON parse failed for ${toLang}, retrying...`);
      // Retry once
      const retry = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [
          { role: "user", content: `You MUST return ONLY valid JSON. No explanation. Translate these JSON values to ${LANG_NAMES[toLang]}:\n${JSON.stringify(strings)}` },
        ],
      });
      const rb = retry.content[0];
      if (rb.type === "text") {
        let rr = rb.text.trim().replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
        const parsed = JSON.parse(rr);
        for (const k of Object.keys(strings)) {
          if (!parsed[k]) parsed[k] = strings[k];
        }
        return parsed;
      }
    }
  }
  return strings;
}

async function translateJson(
  strings: Record<string, string>,
  toLang: string,
): Promise<Record<string, string>> {
  const keys = Object.keys(strings);
  if (keys.length <= CHUNK_SIZE) {
    return translateJsonChunk(strings, toLang);
  }

  // Split into chunks
  const chunks: Record<string, string>[] = [];
  for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
    const chunk: Record<string, string> = {};
    for (const k of keys.slice(i, i + CHUNK_SIZE)) chunk[k] = strings[k];
    chunks.push(chunk);
  }

  console.log(`    splitting into ${chunks.length} chunks of ~${CHUNK_SIZE} keys...`);
  const results = await Promise.all(
    chunks.map((chunk) => translateJsonChunk(chunk, toLang)),
  );

  const merged: Record<string, string> = {};
  for (const r of results) Object.assign(merged, r);
  for (const k of keys) {
    if (!merged[k]) merged[k] = strings[k];
  }
  return merged;
}

async function translateText(text: string, toLang: string): Promise<string> {
  const toName = LANG_NAMES[toLang];
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: `Translate the following text from English to ${toName}.
Return ONLY the translated text, no explanations or quotes.
Keep proper nouns, unit numbers (e.g. "Unit 3B"), and technical terms unchanged.

${text}`,
      },
    ],
  });
  const block = response.content[0];
  return block.type === "text" ? block.text.trim() : text;
}

async function cacheTranslation(
  lang: string,
  sourceType: string,
  sourceId: string,
  sourceText: string,
  translated: string,
) {
  const h = hash(sourceText);
  await prisma.translation.upsert({
    where: {
      lang_sourceType_sourceId_sourceHash: {
        lang, sourceType, sourceId, sourceHash: h,
      },
    },
    update: { content: translated },
    create: { lang, sourceType, sourceId, sourceHash: h, content: translated },
  });
}

async function main() {
  console.log("=== TENANTNET.NYC Translation Pre-Warm ===\n");

  // ─── 1. UI String Files ───────────────────────────────
  const i18nDir = path.resolve(__dirname, "../src/i18n");
  const jsonFiles = fs.readdirSync(i18nDir).filter((f) => f.endsWith(".en.json"));

  for (const file of jsonFiles) {
    const page = file.replace(".en.json", "");
    const raw = fs.readFileSync(path.join(i18nDir, file), "utf8");
    const strings: Record<string, string> = JSON.parse(raw);
    const keyCount = Object.keys(strings).length;

    for (const lang of LANGS) {
      const h = hash(JSON.stringify(strings));
      const existing = await prisma.translation.findUnique({
        where: {
          lang_sourceType_sourceId_sourceHash: {
            lang, sourceType: "ui", sourceId: page, sourceHash: h,
          },
        },
      });

      if (existing) {
        console.log(`  [skip] ui/${page} → ${lang} (cached)`);
        continue;
      }

      console.log(`  [translate] ui/${page} (${keyCount} keys) → ${lang}...`);
      const translated = await translateJson(strings, lang);
      await cacheTranslation(lang, "ui", page, JSON.stringify(strings), JSON.stringify(translated));
      console.log(`  [done] ui/${page} → ${lang}`);
    }
  }

  // ─── 2. Posts ─────────────────────────────────────────
  const posts = await prisma.post.findMany({
    select: { id: true, title: true, titleEn: true, body: true, bodyEn: true, language: true },
  });

  console.log(`\nFound ${posts.length} posts to translate.\n`);

  for (const post of posts) {
    const titleEn = post.titleEn || post.title;
    const bodyEn = post.bodyEn || post.body;

    for (const lang of LANGS) {
      // Title
      const titleHash = hash(titleEn);
      const titleCached = await prisma.translation.findUnique({
        where: {
          lang_sourceType_sourceId_sourceHash: {
            lang, sourceType: "post_title", sourceId: post.id, sourceHash: titleHash,
          },
        },
      });

      if (!titleCached) {
        console.log(`  [translate] post title "${titleEn.slice(0, 40)}..." → ${lang}`);
        const translated = await translateText(titleEn, lang);
        await cacheTranslation(lang, "post_title", post.id, titleEn, translated);
      }

      // Body
      const bodyHash = hash(bodyEn);
      const bodyCached = await prisma.translation.findUnique({
        where: {
          lang_sourceType_sourceId_sourceHash: {
            lang, sourceType: "post_body", sourceId: post.id, sourceHash: bodyHash,
          },
        },
      });

      if (!bodyCached) {
        console.log(`  [translate] post body "${titleEn.slice(0, 40)}..." → ${lang}`);
        const translated = await translateText(bodyEn, lang);
        await cacheTranslation(lang, "post_body", post.id, bodyEn, translated);
      }
    }
  }

  // ─── 3. Comments ──────────────────────────────────────
  const comments = await prisma.comment.findMany({
    select: { id: true, body: true, bodyEn: true, language: true },
  });

  console.log(`\nFound ${comments.length} comments to translate.\n`);

  for (const comment of comments) {
    const bodyEn = comment.bodyEn || comment.body;

    for (const lang of LANGS) {
      const bodyHash = hash(bodyEn);
      const cached = await prisma.translation.findUnique({
        where: {
          lang_sourceType_sourceId_sourceHash: {
            lang, sourceType: "comment_body", sourceId: comment.id, sourceHash: bodyHash,
          },
        },
      });

      if (!cached) {
        console.log(`  [translate] comment "${bodyEn.slice(0, 40)}..." → ${lang}`);
        const translated = await translateText(bodyEn, lang);
        await cacheTranslation(lang, "comment_body", comment.id, bodyEn, translated);
      }
    }
  }

  // ─── Summary ──────────────────────────────────────────
  const totalCached = await prisma.translation.count();
  console.log(`\n=== Done! ${totalCached} total cached translations. ===`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
