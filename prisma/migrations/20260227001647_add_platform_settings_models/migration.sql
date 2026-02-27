-- CreateEnum
CREATE TYPE "MessageChannel" AS ENUM ('EMAIL', 'IN_APP', 'BOTH');

-- CreateEnum
CREATE TYPE "PolicyType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COMMUNITY_GUIDELINES');

-- CreateEnum
CREATE TYPE "NotificationPreferenceType" AS ENUM ('EMAIL_NOTIFICATIONS', 'IN_APP_NOTIFICATIONS', 'DISPUTE_ALERTS', 'REPORT_ALERTS');

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL,
    "platformName" TEXT NOT NULL DEFAULT 'SkillSwap',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'English',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
    "dateFormat" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "status" TEXT NOT NULL DEFAULT 'LIVE',
    "supportEmail" TEXT NOT NULL DEFAULT 'support@skillswap.com',
    "contactPhone" TEXT,
    "socialLinks" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" JSONB DEFAULT '[]',
    "channel" "MessageChannel" NOT NULL DEFAULT 'BOTH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_sections" (
    "id" TEXT NOT NULL,
    "policyType" "PolicyType" NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "sectionContent" TEXT NOT NULL,
    "sectionOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "type" "NotificationPreferenceType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "message_templates_triggerEvent_idx" ON "message_templates"("triggerEvent");

-- CreateIndex
CREATE INDEX "message_templates_isActive_idx" ON "message_templates"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_name_key" ON "message_templates"("name");

-- CreateIndex
CREATE INDEX "policy_sections_policyType_idx" ON "policy_sections"("policyType");

-- CreateIndex
CREATE UNIQUE INDEX "policy_sections_policyType_sectionTitle_key" ON "policy_sections"("policyType", "sectionTitle");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_type_key" ON "notification_preferences"("type");
