/*
  Warnings:

  - The values [REJECTED] on the enum `SwapStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `communicationRating` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `punctualityRating` on the `reviews` table. All the data in the column will be lost.
  - Added the required column `date` to the `swap_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endAt` to the `swap_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startAt` to the `swap_requests` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('TEACHING', 'LEARNING', 'GENERAL');

-- AlterEnum
BEGIN;
CREATE TYPE "SwapStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."swap_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "swap_requests" ALTER COLUMN "status" TYPE "SwapStatus_new" USING ("status"::text::"SwapStatus_new");
ALTER TYPE "SwapStatus" RENAME TO "SwapStatus_old";
ALTER TYPE "SwapStatus_new" RENAME TO "SwapStatus";
DROP TYPE "public"."SwapStatus_old";
ALTER TABLE "swap_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "communicationRating",
DROP COLUMN "punctualityRating",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "overallRating" DROP NOT NULL;

-- AlterTable
ALTER TABLE "swap_requests" ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "endAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "startAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "role" "FeedbackCategory" NOT NULL DEFAULT 'GENERAL',
    "sessionFocus" INTEGER,
    "activeParticipation" INTEGER,
    "learningFocus" INTEGER,
    "clarity" INTEGER,
    "patience" INTEGER,
    "sessionStructure" INTEGER,
    "communication" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "feedbacks_sessionId_giverId_key" ON "feedbacks"("sessionId", "giverId");

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
