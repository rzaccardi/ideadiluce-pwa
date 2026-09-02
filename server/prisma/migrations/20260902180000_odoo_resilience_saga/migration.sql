-- AlterTable
ALTER TABLE "OdooSyncQueue" ALTER COLUMN "pwaOrderId" DROP NOT NULL;
ALTER TABLE "OdooSyncQueue" ADD COLUMN "userId" TEXT;
ALTER TABLE "OdooSyncQueue" ALTER COLUMN "maxAttempts" SET DEFAULT 8;

CREATE INDEX "OdooSyncQueue_userId_idx" ON "OdooSyncQueue"("userId");

-- CreateTable
CREATE TABLE "OdooResilienceSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "emergencyMode" BOOLEAN NOT NULL DEFAULT false,
    "catalogCacheFallback" BOOLEAN NOT NULL DEFAULT true,
    "smtpFallback" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "updatedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OdooResilienceSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "OdooResilienceSettings" ("id", "emergencyMode", "catalogCacheFallback", "smtpFallback", "updatedAt")
VALUES ('default', false, true, true, CURRENT_TIMESTAMP);
