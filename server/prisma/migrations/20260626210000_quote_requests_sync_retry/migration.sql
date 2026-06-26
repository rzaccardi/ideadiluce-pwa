-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('DRAFT', 'REQUESTED', 'SENT', 'CHECKOUT_STARTED', 'CONVERTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SyncRetryJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "billingAddressJson" JSONB,
    "shippingAddressJson" JSONB,
    "linesSnapshotJson" JSONB NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "estimatedSubtotal" INTEGER,
    "estimatedTax" INTEGER,
    "estimatedTotal" INTEGER,
    "odooSaleOrderId" INTEGER,
    "pwaOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRetryJob" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 4,
    "status" "SyncRetryJobStatus" NOT NULL DEFAULT 'PENDING',
    "lastError" TEXT,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncRetryJob_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "ProfessionalAccountRequest" ADD COLUMN "sectorOther" TEXT,
ADD COLUMN "pec" TEXT,
ADD COLUMN "sdiCode" TEXT,
ADD COLUMN "visuraUrl" TEXT;

-- CreateIndex
CREATE INDEX "QuoteRequest_userId_idx" ON "QuoteRequest"("userId");

-- CreateIndex
CREATE INDEX "QuoteRequest_cartId_idx" ON "QuoteRequest"("cartId");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_idx" ON "QuoteRequest"("status");

-- CreateIndex
CREATE INDEX "QuoteRequest_odooSaleOrderId_idx" ON "QuoteRequest"("odooSaleOrderId");

-- CreateIndex
CREATE INDEX "SyncRetryJob_status_nextRetryAt_idx" ON "SyncRetryJob"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "SyncRetryJob_entityType_entityId_idx" ON "SyncRetryJob"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
