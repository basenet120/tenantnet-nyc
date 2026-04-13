-- Add reply_email to buildings
ALTER TABLE "buildings" ADD COLUMN "reply_email" TEXT;

-- Generate reply_email for existing buildings
UPDATE "buildings" SET "reply_email" = CONCAT(
  LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(address, '(street|avenue|boulevard|drive|place|road|lane|court)', '', 'gi'),
    '[^a-z0-9]', '', 'gi'
  )),
  zip,
  'rep@tenantnet.nyc'
);

-- Add unique constraint
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_reply_email_key" UNIQUE ("reply_email");
