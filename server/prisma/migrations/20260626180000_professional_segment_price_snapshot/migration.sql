-- AlterEnum
ALTER TYPE "CustomerSegment" ADD VALUE 'PROFESSIONAL';

-- AlterTable
ALTER TABLE "CheckoutSession" ADD COLUMN "priceSnapshotJson" JSONB;
