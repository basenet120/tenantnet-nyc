-- AlterTable
ALTER TABLE "units" ADD COLUMN     "email" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "is_registered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "units_username_key" ON "units"("username");
