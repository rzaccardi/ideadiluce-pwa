-- AlterTable
ALTER TABLE "Cart" ADD COLUMN "contactEmail" TEXT;

-- AlterTable
ALTER TABLE "AbandonedCartEvent" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "AbandonedCartEvent" ADD COLUMN "userId" TEXT;
ALTER TABLE "AbandonedCartEvent" ADD COLUMN "itemsSnapshotJson" JSONB;

-- CreateIndex
CREATE INDEX "Cart_contactEmail_idx" ON "Cart"("contactEmail");

-- CreateIndex
CREATE INDEX "AbandonedCartEvent_contactEmail_idx" ON "AbandonedCartEvent"("contactEmail");

-- CreateIndex
CREATE INDEX "AbandonedCartEvent_userId_idx" ON "AbandonedCartEvent"("userId");

-- CreateIndex
CREATE INDEX "AbandonedCartEvent_createdAt_idx" ON "AbandonedCartEvent"("createdAt");
