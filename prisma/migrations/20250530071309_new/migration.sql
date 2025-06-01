-- AlterTable
ALTER TABLE "CategoryOccupation" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Ratio" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RatioComponent" ADD COLUMN     "deletedAt" TIMESTAMP(3);
