-- AlterTable
ALTER TABLE "units" ADD COLUMN     "notify_bulletins" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_comments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_new_posts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notify_status_change" BOOLEAN NOT NULL DEFAULT true;
