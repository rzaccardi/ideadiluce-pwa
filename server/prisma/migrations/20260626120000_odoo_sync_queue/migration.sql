-- OdooSyncQueue for failed Odoo sync retries
CREATE TYPE "OdooSyncQueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'EXHAUSTED');

CREATE TABLE "OdooSyncQueue" (
    "id" TEXT NOT NULL,
    "pwaOrderId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 4,
    "nextRetryAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "status" "OdooSyncQueueStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "OdooSyncQueue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OdooSyncQueue_status_nextRetryAt_idx" ON "OdooSyncQueue"("status", "nextRetryAt");
CREATE INDEX "OdooSyncQueue_pwaOrderId_idx" ON "OdooSyncQueue"("pwaOrderId");
CREATE INDEX "OdooSyncQueue_pwaOrderId_operation_status_idx" ON "OdooSyncQueue"("pwaOrderId", "operation", "status");

ALTER TABLE "OdooSyncQueue" ADD CONSTRAINT "OdooSyncQueue_pwaOrderId_fkey" FOREIGN KEY ("pwaOrderId") REFERENCES "PwaOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
