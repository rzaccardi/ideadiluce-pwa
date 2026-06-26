-- Tax validation: User verification fields, VIES cache, audit log

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vatCountryCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vatFormatValid" BOOLEAN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "vatChecksumValid" BOOLEAN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "fiscalCodeValid" BOOLEAN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "viesValid" BOOLEAN;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "viesName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "viesAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "taxValidationStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "taxCheckedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "VatValidationCache" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "valid" BOOLEAN NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "requestDate" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatValidationCache_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VatValidationCache_countryCode_vatNumber_key"
    ON "VatValidationCache"("countryCode", "vatNumber");
CREATE INDEX IF NOT EXISTS "VatValidationCache_expiresAt_idx"
    ON "VatValidationCache"("expiresAt");

CREATE TABLE IF NOT EXISTS "TaxValidationLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "fiscalCodeHash" TEXT,
    "vatCountryCode" TEXT,
    "vatNumberHash" TEXT,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "responseSummary" JSONB,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxValidationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TaxValidationLog_userId_idx" ON "TaxValidationLog"("userId");
CREATE INDEX IF NOT EXISTS "TaxValidationLog_checkedAt_idx" ON "TaxValidationLog"("checkedAt");

ALTER TABLE "TaxValidationLog" ADD CONSTRAINT "TaxValidationLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
