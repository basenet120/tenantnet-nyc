-- Add language preference to units
ALTER TABLE "units" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';

-- Add language + English translation fields to posts
ALTER TABLE "posts" ADD COLUMN "body_en" TEXT;
ALTER TABLE "posts" ADD COLUMN "title_en" TEXT;
ALTER TABLE "posts" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';

-- Add language + English translation fields to comments
ALTER TABLE "comments" ADD COLUMN "body_en" TEXT;
ALTER TABLE "comments" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en';

-- Translation cache table
CREATE TABLE "translations" (
    "id" TEXT NOT NULL,
    "lang" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_hash" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "translations_pkey" PRIMARY KEY ("id")
);

-- Unique constraint for cache lookups
CREATE UNIQUE INDEX "translations_lang_source_type_source_id_source_hash_key"
  ON "translations"("lang", "source_type", "source_id", "source_hash");
