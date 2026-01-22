/*
  Warnings:

  - You are about to drop the column `isRevoked` on the `user_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revokeReason` on the `user_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `user_tokens` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user_tokens` DROP COLUMN `isRevoked`,
    DROP COLUMN `revokeReason`,
    DROP COLUMN `revokedAt`;
