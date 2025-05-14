/*
  Warnings:

  - You are about to drop the column `userId` on the `BudgetAllocation` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `EvaluationResult` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `IncomePeriod` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[categoryId,periodId]` on the table `BudgetAllocation` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[periodId,subcategoryId]` on the table `IncomePeriod` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "BudgetAllocation" DROP CONSTRAINT "BudgetAllocation_userId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluationResult" DROP CONSTRAINT "EvaluationResult_userId_fkey";

-- DropForeignKey
ALTER TABLE "IncomePeriod" DROP CONSTRAINT "IncomePeriod_userId_fkey";

-- DropIndex
DROP INDEX "BudgetAllocation_userId_categoryId_periodId_key";

-- DropIndex
DROP INDEX "idx_budget_user_period";

-- DropIndex
DROP INDEX "IncomePeriod_userId_periodId_subcategoryId_key";

-- DropIndex
DROP INDEX "idx_incperiod_user_period";

-- AlterTable
ALTER TABLE "BudgetAllocation" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "EvaluationResult" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "IncomePeriod" DROP COLUMN "userId";

-- CreateIndex
CREATE INDEX "idx_budget_period" ON "BudgetAllocation"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_categoryId_periodId_key" ON "BudgetAllocation"("categoryId", "periodId");

-- CreateIndex
CREATE INDEX "idx_incperiod_period" ON "IncomePeriod"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomePeriod_periodId_subcategoryId_key" ON "IncomePeriod"("periodId", "subcategoryId");
