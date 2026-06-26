-- CreateTable
CREATE TABLE "TaxRule" (
    "id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "customerSegment" "CustomerSegment",
    "isProfessional" BOOLEAN,
    "billingCountry" TEXT,
    "shippingCountry" TEXT NOT NULL,
    "vatValid" BOOLEAN,
    "taxRatePct" DECIMAL(5,2) NOT NULL,
    "taxLabel" TEXT NOT NULL,
    "disclaimerKey" TEXT,
    "odooFiscalPositionId" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatValidationAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "forceAccepted" BOOLEAN NOT NULL DEFAULT false,
    "lastValid" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatValidationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxRule_enabled_priority_idx" ON "TaxRule"("enabled", "priority");

-- CreateIndex
CREATE INDEX "VatValidationAttempt_sessionId_idx" ON "VatValidationAttempt"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "VatValidationAttempt_sessionId_vatNumber_key" ON "VatValidationAttempt"("sessionId", "vatNumber");
