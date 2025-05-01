/*
  Warnings:

  - The values [PENDING,COMPLETED,FAILED] on the enum `EvaluationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EvaluationStatus_new" AS ENUM ('IDEAL', 'NOT_IDEAL');
ALTER TABLE "Evaluation" ALTER COLUMN "status" TYPE "EvaluationStatus_new" USING ("status"::text::"EvaluationStatus_new");
ALTER TYPE "EvaluationStatus" RENAME TO "EvaluationStatus_old";
ALTER TYPE "EvaluationStatus_new" RENAME TO "EvaluationStatus";
DROP TYPE "EvaluationStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
