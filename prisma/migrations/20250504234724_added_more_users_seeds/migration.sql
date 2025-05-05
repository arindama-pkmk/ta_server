/*
  Warnings:

  - You are about to drop the column `calculationResult` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Evaluation` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,start,end]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `end` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ideal` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incomplete` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notIdeal` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start` to the `Evaluation` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Evaluation` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `address` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthdate` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_userId_fkey";

-- DropIndex
DROP INDEX "idx_evaluation_transaction";

-- DropIndex
DROP INDEX "User_phone_key";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "calculationResult",
DROP COLUMN "date",
DROP COLUMN "description",
DROP COLUMN "status",
DROP COLUMN "transactionId",
ADD COLUMN     "end" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "ideal" INTEGER NOT NULL,
ADD COLUMN     "incomplete" INTEGER NOT NULL,
ADD COLUMN     "notIdeal" INTEGER NOT NULL,
ADD COLUMN     "start" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "transactions" TEXT[],
ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "phone",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "birthdate" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "idx_evaluation_history_user" ON "Evaluation"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_userId_start_end_key" ON "Evaluation"("userId", "start", "end");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
