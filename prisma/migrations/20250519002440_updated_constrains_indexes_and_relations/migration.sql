/*
  Warnings:

  - Added the required column `status` to the `EvaluationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `EvaluationResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "EvaluationResult" ADD COLUMN     "status" "EvaluationStatus" NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Ratio" ADD COLUMN     "isLowerBoundInclusive" BOOLEAN DEFAULT true,
ADD COLUMN     "isUpperBoundInclusive" BOOLEAN DEFAULT true;

-- CreateIndex
CREATE INDEX "EvaluationResult_userId_idx" ON "EvaluationResult"("userId");

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
