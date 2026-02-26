/*
  Warnings:

  - A unique constraint covering the columns `[sessionId,giverId,role]` on the table `feedbacks` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "feedbacks_sessionId_giverId_key";

-- AlterTable
ALTER TABLE "feedbacks" ALTER COLUMN "role" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_sessionId_giverId_role_key" ON "feedbacks"("sessionId", "giverId", "role");
