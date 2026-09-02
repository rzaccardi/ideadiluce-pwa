-- CreateTable
CREATE TABLE "OrderReturnRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "pwaOrderId" TEXT,
    "odooSaleOrderId" INTEGER,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'IT',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderReturnRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderReturnRequest_userId_orderId_key" ON "OrderReturnRequest"("userId", "orderId");

-- CreateIndex
CREATE INDEX "OrderReturnRequest_userId_idx" ON "OrderReturnRequest"("userId");

-- CreateIndex
CREATE INDEX "OrderReturnRequest_status_idx" ON "OrderReturnRequest"("status");

-- CreateIndex
CREATE INDEX "OrderReturnRequest_createdAt_idx" ON "OrderReturnRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "OrderReturnRequest" ADD CONSTRAINT "OrderReturnRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
