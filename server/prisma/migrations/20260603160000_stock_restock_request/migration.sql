-- CreateTable
CREATE TABLE "StockRestockRequest" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productRef" TEXT NOT NULL,
    "variantRef" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "locale" TEXT NOT NULL DEFAULT 'IT',
    "productName" TEXT,
    "userId" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockRestockRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockRestockRequest_productRef_idx" ON "StockRestockRequest"("productRef");

-- CreateIndex
CREATE INDEX "StockRestockRequest_notifiedAt_idx" ON "StockRestockRequest"("notifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockRestockRequest_email_productRef_variantRef_key" ON "StockRestockRequest"("email", "productRef", "variantRef");
