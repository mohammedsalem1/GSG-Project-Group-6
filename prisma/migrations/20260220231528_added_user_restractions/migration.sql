/*
  Warnings:

  - The values [EXPERT] on the enum `SkillLevel` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "RestrictionType" AS ENUM ('BAN', 'SUSPENSION', 'WARNING', 'ADMIN_NOTE');

-- AlterEnum
BEGIN;
CREATE TYPE "SkillLevel_new" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
ALTER TABLE "public"."user_skills" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "user_skills" ALTER COLUMN "level" TYPE "SkillLevel_new" USING ("level"::text::"SkillLevel_new");
ALTER TYPE "SkillLevel" RENAME TO "SkillLevel_old";
ALTER TYPE "SkillLevel_new" RENAME TO "SkillLevel";
DROP TYPE "public"."SkillLevel_old";
ALTER TABLE "user_skills" ALTER COLUMN "level" SET DEFAULT 'BEGINNER';
COMMIT;

-- DropIndex
DROP INDEX "users_userName_key";

-- CreateTable
CREATE TABLE "user-restrictions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RestrictionType" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),

    CONSTRAINT "user-restrictions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user-restrictions" ADD CONSTRAINT "user-restrictions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
