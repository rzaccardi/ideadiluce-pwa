-- CreateTable
CREATE TABLE "OrderShipmentSnapshot" (
    "id" TEXT NOT NULL,
    "odooSaleOrderId" INTEGER NOT NULL,
    "pwaOrderId" TEXT,
    "carrier" TEXT,
    "trackingNumber" TEXT,
    "status" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(3),
    "payloadJson" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "nextRefreshAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderShipmentSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderShipmentSnapshot_odooSaleOrderId_key" ON "OrderShipmentSnapshot"("odooSaleOrderId");

-- CreateIndex
CREATE INDEX "OrderShipmentSnapshot_nextRefreshAt_idx" ON "OrderShipmentSnapshot"("nextRefreshAt");

-- CreateIndex
CREATE INDEX "OrderShipmentSnapshot_pwaOrderId_idx" ON "OrderShipmentSnapshot"("pwaOrderId");
