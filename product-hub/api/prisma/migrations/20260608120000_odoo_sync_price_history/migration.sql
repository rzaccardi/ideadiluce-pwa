-- CreateEnum
CREATE TYPE "OdooCatalogSyncStatus" AS ENUM ('MAPPED', 'UNMAPPED', 'IGNORED');

-- CreateTable
CREATE TABLE "OdooCatalogSync" (
    "odooTemplateId" INTEGER NOT NULL,
    "odooName" TEXT,
    "odooSku" TEXT,
    "hubProductId" TEXT,
    "status" "OdooCatalogSyncStatus" NOT NULL DEFAULT 'UNMAPPED',
    "ignoredAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdooCatalogSync_pkey" PRIMARY KEY ("odooTemplateId")
);

-- CreateTable
CREATE TABLE "ProductPriceHistory" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "pricelistId" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'odoo',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OdooCatalogSync_hubProductId_key" ON "OdooCatalogSync"("hubProductId");

-- CreateIndex
CREATE INDEX "OdooCatalogSync_status_idx" ON "OdooCatalogSync"("status");

-- CreateIndex
CREATE INDEX "OdooCatalogSync_hubProductId_idx" ON "OdooCatalogSync"("hubProductId");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_productId_recordedAt_idx" ON "ProductPriceHistory"("productId", "recordedAt");

-- AddForeignKey
ALTER TABLE "OdooCatalogSync" ADD CONSTRAINT "OdooCatalogSync_hubProductId_fkey" FOREIGN KEY ("hubProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
