-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('SESSION_ISSUE', 'POINTS_ISSUE', 'USER_BEHAVIOR', 'TECHNICAL_PROBLEM', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "type" "DisputeType" NOT NULL,
    "description" TEXT,
    "screenshot" TEXT,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "reporterId" TEXT NOT NULL,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
