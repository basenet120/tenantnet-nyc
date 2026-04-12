-- AlterTable: make unit_id nullable on comments
ALTER TABLE "comments" ALTER COLUMN "unit_id" DROP NOT NULL;

-- AddColumn: admin_id to comments
ALTER TABLE "comments" ADD COLUMN "admin_id" TEXT;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
