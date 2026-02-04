/*
  Warnings:

  - You are about to drop the column `communicationRating` on the `reviews` table. All the data in the column will be lost.
  - You are about to drop the column `punctualityRating` on the `reviews` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('TEACHING', 'LEARNING', 'GENERAL');

-- AlterTable
ALTER TABLE "reviews" DROP COLUMN "communicationRating",
DROP COLUMN "punctualityRating",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "overallRating" DROP NOT NULL;

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
