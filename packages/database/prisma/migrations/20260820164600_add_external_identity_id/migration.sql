-- AlterTable
ALTER TABLE "User" ADD COLUMN "externalIdentityId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_externalIdentityId_key" ON "User"("externalIdentityId");
