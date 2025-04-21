/*
  Warnings:

  - You are about to drop the column `category` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `subcategory` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `categoryId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `userId` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "EvaluationStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "category",
DROP COLUMN "subcategory",
ADD COLUMN     "categoryId" TEXT NOT NULL,
ALTER COLUMN "date" SET DATA TYPE TIMESTAMPTZ(6),
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL,
ALTER COLUMN "userId" SET NOT NULL;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "subcategoryName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AllocationTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "minLimit" INTEGER NOT NULL,
    "maxLimit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AllocationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT,
    "transactionId" TEXT NOT NULL,
    "month" TIMESTAMP(3) NOT NULL,
    "categoryName" TEXT NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EvaluationStatus" NOT NULL,
    "calculationResult" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_categoryName_subcategoryName_key" ON "Category"("userId", "categoryName", "subcategoryName");

-- CreateIndex
CREATE UNIQUE INDEX "AllocationTemplate_userId_job_categoryName_key" ON "AllocationTemplate"("userId", "job", "categoryName");

-- CreateIndex
CREATE INDEX "idx_allocation_transaction" ON "Allocation"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_userId_month_categoryName_key" ON "Allocation"("userId", "month", "categoryName");

-- CreateIndex
CREATE INDEX "idx_evaluation_transaction" ON "Evaluation"("transactionId");

-- CreateIndex
CREATE INDEX "idx_transaction_user_date" ON "Transaction"("userId", "date");

-- AddForeignKey
ALTER TABLE "OtpVerification" ADD CONSTRAINT "OtpVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationTemplate" ADD CONSTRAINT "AllocationTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AllocationTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
