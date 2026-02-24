-- AlterTable
ALTER TABLE "user_skills" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "sessionLanguage" TEXT DEFAULT 'English',
ADD COLUMN     "skillDescription" TEXT,
ALTER COLUMN "isOffering" SET DEFAULT true;
