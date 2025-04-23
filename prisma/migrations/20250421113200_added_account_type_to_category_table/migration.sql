/*
  Warnings:

  - A unique constraint covering the columns `[accountType,categoryName,subcategoryName]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountType` to the `Category` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Category_categoryName_subcategoryName_key";

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "accountType" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_accountType_categoryName_subcategoryName_key" ON "Category"("accountType", "categoryName", "subcategoryName");
