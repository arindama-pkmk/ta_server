/*
  Warnings:

  - You are about to drop the column `userId` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[categoryName,subcategoryName]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_userId_fkey";

-- DropIndex
DROP INDEX "Category_userId_categoryName_subcategoryName_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "Category_categoryName_subcategoryName_key" ON "Category"("categoryName", "subcategoryName");
