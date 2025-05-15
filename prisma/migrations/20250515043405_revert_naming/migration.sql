/*
  Warnings:

  - The primary key for the `EvaluationResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Ratio` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RatioComponent` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "EvaluationResult" DROP CONSTRAINT "EvaluationResult_ratioId_fkey";

-- DropForeignKey
ALTER TABLE "RatioComponent" DROP CONSTRAINT "RatioComponent_ratioId_fkey";

-- AlterTable
ALTER TABLE "EvaluationResult" DROP CONSTRAINT "EvaluationResult_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "ratioId" SET DATA TYPE TEXT,
ADD CONSTRAINT "EvaluationResult_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "EvaluationResult_id_seq";

-- AlterTable
ALTER TABLE "Ratio" DROP CONSTRAINT "Ratio_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Ratio_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Ratio_id_seq";

-- AlterTable
ALTER TABLE "RatioComponent" DROP CONSTRAINT "RatioComponent_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "ratioId" SET DATA TYPE TEXT,
ADD CONSTRAINT "RatioComponent_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "RatioComponent_id_seq";

-- AddForeignKey
ALTER TABLE "RatioComponent" ADD CONSTRAINT "RatioComponent_ratioId_fkey" FOREIGN KEY ("ratioId") REFERENCES "Ratio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluationResult" ADD CONSTRAINT "EvaluationResult_ratioId_fkey" FOREIGN KEY ("ratioId") REFERENCES "Ratio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_category_account_type" RENAME TO "idx_category_accountType";

-- RenameIndex
ALTER INDEX "idx_catoccupation_occupation" RENAME TO "idx_categoryOccupation_occupation";

-- RenameIndex
ALTER INDEX "idx_incperiod_period" RENAME TO "idx_incomePeriod_period";

-- RenameIndex
ALTER INDEX "idx_incperiod_subcategory" RENAME TO "idx_incomePeriod_subcategory";

-- RenameIndex
ALTER INDEX "idx_otp_expires" RENAME TO "idx_otp_expiresAt";

-- RenameIndex
ALTER INDEX "idx_ratiocomponent_ratio" RENAME TO "idx_ratioComponent_ratio";

-- RenameIndex
ALTER INDEX "idx_ratiocomponent_subcat" RENAME TO "idx_ratioComponent_subcategory";
