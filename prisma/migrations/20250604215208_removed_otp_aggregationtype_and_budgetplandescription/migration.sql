/*
  Warnings:

  - You are about to drop the column `description` on the `BudgetPlan` table. All the data in the column will be lost.
  - You are about to drop the column `aggregationType` on the `RatioComponent` table. All the data in the column will be lost.
  - You are about to drop the `OtpVerification` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,planStartDate,planEndDate]` on the table `BudgetPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "OtpVerification" DROP CONSTRAINT "OtpVerification_userId_fkey";

-- DropIndex
DROP INDEX "BudgetPlan_userId_planStartDate_planEndDate_description_key";

-- AlterTable
ALTER TABLE "BudgetPlan" DROP COLUMN "description";

-- AlterTable
ALTER TABLE "RatioComponent" DROP COLUMN "aggregationType";

-- DropTable
DROP TABLE "OtpVerification";

-- DropEnum
DROP TYPE "AggregationType";

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPlan_userId_planStartDate_planEndDate_key" ON "BudgetPlan"("userId", "planStartDate", "planEndDate");
