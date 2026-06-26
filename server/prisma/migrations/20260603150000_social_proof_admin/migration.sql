-- CreateTable
CREATE TABLE "SocialProofSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "lookbackDays" INTEGER NOT NULL DEFAULT 30,
    "maxEvents" INTEGER NOT NULL DEFAULT 12,
    "odooImportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "odooLastSyncAt" TIMESTAMP(3),
    "odooLastSyncCount" INTEGER,
    "odooLastSyncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialProofSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialProofOdooEvent" (
    "id" TEXT NOT NULL,
    "odooLineId" INTEGER NOT NULL,
    "odooSaleOrderId" INTEGER NOT NULL,
    "productTemplateId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL,
    "buyerLabel" TEXT NOT NULL,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialProofOdooEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialProofOdooEvent_odooLineId_key" ON "SocialProofOdooEvent"("odooLineId");

-- CreateIndex
CREATE INDEX "SocialProofOdooEvent_productTemplateId_purchasedAt_idx" ON "SocialProofOdooEvent"("productTemplateId", "purchasedAt");

-- CreateIndex
CREATE INDEX "SocialProofOdooEvent_purchasedAt_idx" ON "SocialProofOdooEvent"("purchasedAt");
