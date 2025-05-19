/*
  Warnings:

  - A unique constraint covering the columns `[categoryId,periodId,subcategoryId]` on the table `BudgetAllocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,startDate,endDate,periodType]` on the table `Period` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ratioId,subcategoryId,side]` on the table `RatioComponent` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `subcategoryId` to the `BudgetAllocation` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "BudgetAllocation_categoryId_periodId_key";

-- DropIndex
DROP INDEX "Period_userId_startDate_endDate_key";

-- DropIndex
DROP INDEX "RatioComponent_ratioId_subcategoryId_key";

-- AlterTable
ALTER TABLE "BudgetAllocation" ADD COLUMN     "subcategoryId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "idx_budget_subcategory" ON "BudgetAllocation"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_categoryId_periodId_subcategoryId_key" ON "BudgetAllocation"("categoryId", "periodId", "subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Period_userId_startDate_endDate_periodType_key" ON "Period"("userId", "startDate", "endDate", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "RatioComponent_ratioId_subcategoryId_side_key" ON "RatioComponent"("ratioId", "subcategoryId", "side");

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
