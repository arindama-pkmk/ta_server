/*
  Warnings:

  - You are about to drop the column `accountType` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `categoryName` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `subcategoryName` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `categoryId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Allocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AllocationTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Evaluation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EvaluationTransaction` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[accountTypeId,name]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `accountTypeId` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subcategoryId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Side" AS ENUM ('numerator', 'denominator');

-- CreateEnum
CREATE TYPE "AggregationType" AS ENUM ('SUM', 'AVG');

-- AlterEnum
ALTER TYPE "EvaluationStatus" ADD VALUE 'INCOMPLETE';

-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_templateId_fkey";

-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_userId_fkey";

-- DropForeignKey
ALTER TABLE "AllocationTemplate" DROP CONSTRAINT "AllocationTemplate_userId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_userId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluationTransaction" DROP CONSTRAINT "EvaluationTransaction_evaluationId_fkey";

-- DropForeignKey
ALTER TABLE "EvaluationTransaction" DROP CONSTRAINT "EvaluationTransaction_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_categoryId_fkey";

-- DropIndex
DROP INDEX "Category_accountType_categoryName_subcategoryName_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "accountType",
DROP COLUMN "categoryName",
DROP COLUMN "subcategoryName",
ADD COLUMN     "accountTypeId" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "categoryId",
ADD COLUMN     "subcategoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "occupation",
ADD COLUMN     "occupationId" TEXT;

-- DropTable
DROP TABLE "Allocation";

-- DropTable
DROP TABLE "AllocationTemplate";

-- DropTable
DROP TABLE "Evaluation";

-- DropTable
DROP TABLE "EvaluationTransaction";

-- CreateTable
CREATE TABLE "AccountType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AccountType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryOccupation" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "occupationId" TEXT NOT NULL,
    "upperBound" DOUBLE PRECISION,
    "lowerBound" DOUBLE PRECISION,

    CONSTRAINT "CategoryOccupation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Occupation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Occupation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Period" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'income',
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Period_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncomePeriod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncomePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetAllocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "percentage" DECIMAL(65,30) NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ratio" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "lowerBound" DOUBLE PRECISION,
    "upperBound" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ratio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatioComponent" (
    "id" SERIAL NOT NULL,
    "ratioId" INTEGER NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "side" "Side" NOT NULL,
    "sign" INTEGER NOT NULL,
    "aggregationType" "AggregationType" NOT NULL,

    CONSTRAINT "RatioComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluationResult" (
    "id" SERIAL NOT NULL,
    "ratioId" INTEGER NOT NULL,
    "periodId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountType_name_key" ON "AccountType"("name");

-- CreateIndex
CREATE INDEX "idx_catoccupation_occupation" ON "CategoryOccupation"("occupationId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryOccupation_categoryId_occupationId_key" ON "CategoryOccupation"("categoryId", "occupationId");

-- CreateIndex
CREATE INDEX "idx_subcategory_category" ON "Subcategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_name_key" ON "Subcategory"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Occupation_name_key" ON "Occupation"("name");

-- CreateIndex
CREATE INDEX "idx_period_user_type" ON "Period"("userId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "Period_userId_startDate_endDate_key" ON "Period"("userId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "idx_incperiod_user_period" ON "IncomePeriod"("userId", "periodId");

-- CreateIndex
CREATE INDEX "idx_incperiod_subcategory" ON "IncomePeriod"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "IncomePeriod_userId_periodId_subcategoryId_key" ON "IncomePeriod"("userId", "periodId", "subcategoryId");

-- CreateIndex
CREATE INDEX "idx_budget_user_period" ON "BudgetAllocation"("userId", "periodId");

-- CreateIndex
CREATE INDEX "idx_budget_category" ON "BudgetAllocation"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetAllocation_userId_categoryId_periodId_key" ON "BudgetAllocation"("userId", "categoryId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "Ratio_code_key" ON "Ratio"("code");

-- CreateIndex
CREATE INDEX "idx_ratiocomponent_ratio" ON "RatioComponent"("ratioId");

-- CreateIndex
CREATE INDEX "idx_ratiocomponent_subcat" ON "RatioComponent"("subcategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "RatioComponent_ratioId_subcategoryId_key" ON "RatioComponent"("ratioId", "subcategoryId");

-- CreateIndex
CREATE INDEX "idx_result_period" ON "EvaluationResult"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluationResult_ratioId_periodId_key" ON "EvaluationResult"("ratioId", "periodId");

-- CreateIndex
CREATE INDEX "idx_category_account_type" ON "Category"("accountTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Category_accountTypeId_name_key" ON "Category"("accountTypeId", "name");

-- CreateIndex
CREATE INDEX "idx_transaction_subcategory" ON "Transaction"("subcategoryId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_accountTypeId_fkey" FOREIGN KEY ("accountTypeId") REFERENCES "AccountType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOccupation" ADD CONSTRAINT "CategoryOccupation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryOccupation" ADD CONSTRAINT "CategoryOccupation_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "Occupation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Period" ADD CONSTRAINT "Period_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomePeriod" ADD CONSTRAINT "IncomePeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomePeriod" ADD CONSTRAINT "IncomePeriod_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncomePeriod" ADD CONSTRAINT "IncomePeriod_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetAllocation" ADD CONSTRAINT "BudgetAllocation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatioComponent" ADD CONSTRAINT "RatioComponent_ratioId_fkey" FOREIGN KEY ("ratioId") REFERENCES "Ratio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatioComponent" ADD CONSTRAINT "RatioComponent_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_ratioId_fkey" FOREIGN KEY ("ratioId") REFERENCES "Ratio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "Period"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
