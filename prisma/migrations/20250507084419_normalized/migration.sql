/*
  Warnings:

  - You are about to drop the column `month` on the `Allocation` table. All the data in the column will be lost.
  - You are about to drop the column `ideal` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `incomplete` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `notIdeal` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `transactions` on the `Evaluation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,period,categoryName]` on the table `Allocation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `period` to the `Allocation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Allocation" DROP CONSTRAINT "Allocation_userId_fkey";

-- DropForeignKey
ALTER TABLE "AllocationTemplate" DROP CONSTRAINT "AllocationTemplate_userId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_userId_fkey";

-- DropForeignKey
ALTER TABLE "OtpVerification" DROP CONSTRAINT "OtpVerification_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropIndex
DROP INDEX "Allocation_userId_month_categoryName_key";

-- AlterTable
ALTER TABLE "Allocation" DROP COLUMN "month",
ADD COLUMN     "period" DATE NOT NULL;

-- AlterTable
ALTER TABLE "AllocationTemplate" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "ideal",
DROP COLUMN "incomplete",
DROP COLUMN "notIdeal",
DROP COLUMN "transactions",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" "EvaluationStatus" NOT NULL;

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EvaluationTransaction" (
    "evaluationId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,

    CONSTRAINT "EvaluationTransaction_pkey" PRIMARY KEY ("evaluationId","transactionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_userId_period_categoryName_key" ON "Allocation"("userId", "period", "categoryName");

-- CreateIndex
CREATE INDEX "idx_otp_expires" ON "OtpVerification"("expiresAt");

-- AddForeignKey
ALTER TABLE "OtpVerification" ADD CONSTRAINT "OtpVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AllocationTemplate" ADD CONSTRAINT "AllocationTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationTransaction" ADD CONSTRAINT "EvaluationTransaction_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationTransaction" ADD CONSTRAINT "EvaluationTransaction_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
