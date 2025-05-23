/*
  Warnings:

  - You are about to drop the column `periodId` on the `EvaluationResult` table. All the data in the column will be lost.
  - You are about to drop the `BudgetAllocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `IncomePeriod` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Period` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,accountTypeId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,ratioId,startDate,endDate]` on the table `EvaluationResult` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,categoryId]` on the table `Subcategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `CategoryOccupation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `EvaluationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `EvaluationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `OtpVerification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RatioComponent` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "BudgetAllocation" DROP CONSTRAINT "BudgetAllocation_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "BudgetAllocation" DROP CONSTRAINT "BudgetAllocation_periodId_fkey";

-- DropForeignKey
ALTER TABLE "BudgetAllocation" DROP CONSTRAINT "BudgetAllocation_subcategoryId_fkey";

-- DropForeignKey
ALTER TABLE "Category" DROP CONSTRAINT "Category_accountTypeId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryOccupation" DROP CONSTRAINT "CategoryOccupation_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "CategoryOccupation" DROP CONSTRAINT "CategoryOccupation_occupationId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluationResult" DROP CONSTRAINT "EvaluationResult_periodId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluationResult" DROP CONSTRAINT "EvaluationResult_ratioId_fkey";

-- DropForeignKey
ALTER TABLE "IncomePeriod" DROP CONSTRAINT "IncomePeriod_periodId_fkey";

-- DropForeignKey
ALTER TABLE "IncomePeriod" DROP CONSTRAINT "IncomePeriod_subcategoryId_fkey";

-- DropForeignKey
ALTER TABLE "Period" DROP CONSTRAINT "Period_userId_fkey";

-- DropForeignKey
ALTER TABLE "RatioComponent" DROP CONSTRAINT "RatioComponent_subcategoryId_fkey";

-- DropForeignKey
ALTER TABLE "Subcategory" DROP CONSTRAINT "Subcategory_categoryId_fkey";

-- DropIndex
DROP INDEX "Category_accountTypeId_name_key";

-- DropIndex
DROP INDEX "EvaluationResult_ratioId_periodId_key";

-- DropIndex
DROP INDEX "idx_result_period";

-- DropIndex
DROP INDEX "idx_otp_expiresAt";

-- DropIndex
DROP INDEX "Subcategory_categoryId_name_key";

-- DropIndex
DROP INDEX "idx_transaction_user_date";

-- AlterTable
ALTER TABLE "CategoryOccupation" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "EvaluationResult" DROP COLUMN "periodId",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Ratio" ADD COLUMN     "description" TEXT,
ADD COLUMN     "idealText" TEXT,
ALTER COLUMN "multiplier" DROP NOT NULL,
ALTER COLUMN "multiplier" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "RatioComponent" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "birthdate" DROP NOT NULL;

-- DropTable
DROP TABLE "BudgetAllocation";

-- DropTable
DROP TABLE "IncomePeriod";

-- DropTable
DROP TABLE "Period";

-- CreateTable
CREATE TABLE "BudgetPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT,
    "planStartDate" TIMESTAMP(3) NOT NULL,
    "planEndDate" TIMESTAMP(3) NOT NULL,
    "incomeCalculationStartDate" TIMESTAMP(3) NOT NULL,
    "incomeCalculationEndDate" TIMESTAMP(3) NOT NULL,
    "totalCalculatedIncome" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BudgetPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseAllocation" (
    "id" TEXT NOT NULL,
    "budgetPlanId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ExpenseAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BudgetPlan_userId_idx" ON "BudgetPlan"("userId");

-- CreateIndex
CREATE INDEX "BudgetPlan_userId_planStartDate_planEndDate_idx" ON "BudgetPlan"("userId", "planStartDate", "planEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPlan_userId_planStartDate_planEndDate_description_key" ON "BudgetPlan"("userId", "planStartDate", "planEndDate", "description");

-- CreateIndex
CREATE INDEX "ExpenseAllocation_budgetPlanId_idx" ON "ExpenseAllocation"("budgetPlanId");

-- CreateIndex
CREATE INDEX "ExpenseAllocation_categoryId_idx" ON "ExpenseAllocation"("categoryId");

-- CreateIndex
CREATE INDEX "ExpenseAllocation_subcategoryId_idx" ON "ExpenseAllocation"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_accountTypeId_key" ON "Category"("name", "accountTypeId");

-- CreateIndex
CREATE INDEX "CategoryOccupation_categoryId_idx" ON "CategoryOccupation"("categoryId");

-- CreateIndex
CREATE INDEX "EvaluationResult_ratioId_idx" ON "EvaluationResult"("ratioId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationResult_userId_ratioId_startDate_endDate_key" ON "EvaluationResult"("userId", "ratioId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "OtpVerification_email_idx" ON "OtpVerification"("email");

-- CreateIndex
CREATE INDEX "OtpVerification_userId_idx" ON "OtpVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_name_categoryId_key" ON "Subcategory"("name", "categoryId");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_accountTypeId_fkey" FOREIGN KEY ("accountTypeId") REFERENCES "AccountType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOccupation" ADD CONSTRAINT "CategoryOccupation_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOccupation" ADD CONSTRAINT "CategoryOccupation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPlan" ADD CONSTRAINT "BudgetPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseAllocation" ADD CONSTRAINT "ExpenseAllocation_budgetPlanId_fkey" FOREIGN KEY ("budgetPlanId") REFERENCES "BudgetPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseAllocation" ADD CONSTRAINT "ExpenseAllocation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseAllocation" ADD CONSTRAINT "ExpenseAllocation_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatioComponent" ADD CONSTRAINT "RatioComponent_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_ratioId_fkey" FOREIGN KEY ("ratioId") REFERENCES "Ratio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_category_accountType" RENAME TO "Category_accountTypeId_idx";

-- RenameIndex
ALTER INDEX "idx_categoryOccupation_occupation" RENAME TO "CategoryOccupation_occupationId_idx";

-- RenameIndex
ALTER INDEX "idx_ratioComponent_ratio" RENAME TO "RatioComponent_ratioId_idx";

-- RenameIndex
ALTER INDEX "idx_ratioComponent_subcategory" RENAME TO "RatioComponent_subcategoryId_idx";

-- RenameIndex
ALTER INDEX "idx_subcategory_category" RENAME TO "Subcategory_categoryId_idx";

-- RenameIndex
ALTER INDEX "idx_transaction_subcategory" RENAME TO "Transaction_subcategoryId_idx";
