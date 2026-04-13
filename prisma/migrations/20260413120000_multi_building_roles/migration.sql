-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('system_admin', 'tenant_rep', 'mgmt_rep');

-- CreateEnum
CREATE TYPE "PostVisibility" AS ENUM ('public', 'private');

-- CreateEnum
CREATE TYPE "Borough" AS ENUM ('manhattan', 'bronx', 'brooklyn', 'queens', 'staten_island');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('rent_stabilized', 'market_rate', 'coop', 'condo', 'other');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('dob_profile', 'dob_violations', 'dob_complaints', 'hpd_violations', 'hpd_complaints', 'hpd_registration', 'nyc_311', 'acris', 'zola', 'custom');

-- CreateTable: buildings
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "borough" "Borough" NOT NULL,
    "zip" TEXT NOT NULL,
    "block" TEXT,
    "lot" TEXT,
    "bin" TEXT,
    "floors" INTEGER NOT NULL,
    "total_units" INTEGER NOT NULL,
    "year_built" INTEGER,
    "building_type" "BuildingType" NOT NULL DEFAULT 'rent_stabilized',
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "management_company" TEXT,
    "management_phone" TEXT,
    "management_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: building_records
CREATE TABLE "building_records" (
    "id" TEXT NOT NULL,
    "building_id" TEXT NOT NULL,
    "record_type" "RecordType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "auto_generated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable: building_signups
CREATE TABLE "building_signups" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "borough" TEXT,
    "zip" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "contact_phone" TEXT,
    "unit_count" INTEGER,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "building_signups_pkey" PRIMARY KEY ("id")
);

-- Insert seed building for existing data
INSERT INTO "buildings" ("id", "name", "address", "borough", "zip", "block", "lot", "bin", "floors", "total_units", "year_built", "building_type", "amenities", "updated_at")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '449 West 125th Street',
    '449 West 125th Street',
    'manhattan',
    '10027',
    '1964',
    '55',
    '1056573',
    5,
    17,
    NULL,
    'rent_stabilized',
    '[]',
    CURRENT_TIMESTAMP
);

-- Add building_id to units (nullable first)
ALTER TABLE "units" ADD COLUMN "building_id" TEXT;
UPDATE "units" SET "building_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "units" ALTER COLUMN "building_id" SET NOT NULL;

-- Add building_id to sections (nullable first)
ALTER TABLE "sections" ADD COLUMN "building_id" TEXT;
UPDATE "sections" SET "building_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "sections" ALTER COLUMN "building_id" SET NOT NULL;

-- Add building_id to posts (nullable first)
ALTER TABLE "posts" ADD COLUMN "building_id" TEXT;
UPDATE "posts" SET "building_id" = '00000000-0000-0000-0000-000000000001';
ALTER TABLE "posts" ALTER COLUMN "building_id" SET NOT NULL;

-- Add visibility to posts
ALTER TABLE "posts" ADD COLUMN "visibility" "PostVisibility" NOT NULL DEFAULT 'public';

-- Add building_id to sessions
ALTER TABLE "sessions" ADD COLUMN "building_id" TEXT;

-- Add new admin columns
ALTER TABLE "admins" ADD COLUMN "role" "AdminRole" NOT NULL DEFAULT 'tenant_rep';
ALTER TABLE "admins" ADD COLUMN "building_id" TEXT;
ALTER TABLE "admins" ADD COLUMN "name" TEXT;
ALTER TABLE "admins" ADD COLUMN "invited_by" TEXT;
ALTER TABLE "admins" ADD COLUMN "auto_forward_posts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "admins" ADD COLUMN "auto_forward_sections" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "admins" ADD COLUMN "notify_digest" BOOLEAN NOT NULL DEFAULT false;

-- Update existing admin to system_admin
UPDATE "admins" SET "role" = 'system_admin';

-- Drop old unique constraints
ALTER TABLE "units" DROP CONSTRAINT IF EXISTS "units_label_key";
ALTER TABLE "sections" DROP CONSTRAINT IF EXISTS "sections_slug_key";

-- Add compound unique constraints
ALTER TABLE "units" ADD CONSTRAINT "units_building_id_label_key" UNIQUE ("building_id", "label");
ALTER TABLE "sections" ADD CONSTRAINT "sections_building_id_slug_key" UNIQUE ("building_id", "slug");

-- Fix Session FK cascades: drop old FKs and re-add with CASCADE
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_unit_id_fkey";
ALTER TABLE "sessions" DROP CONSTRAINT IF EXISTS "sessions_admin_id_fkey";
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Fix Comment FK cascades: drop old FKs and re-add with SET NULL
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_unit_id_fkey";
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_admin_id_fkey";
ALTER TABLE "comments" ADD CONSTRAINT "comments_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign keys for new building_id columns
ALTER TABLE "units" ADD CONSTRAINT "units_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "posts" ADD CONSTRAINT "posts_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admins" ADD CONSTRAINT "admins_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "building_records" ADD CONSTRAINT "building_records_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "buildings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
