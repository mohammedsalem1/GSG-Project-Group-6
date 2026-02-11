/*
  Warnings:

  - A unique constraint covering the columns `[categoryId,name]` on the table `skills` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "skills_categoryId_name_key" ON "skills"("categoryId", "name");
