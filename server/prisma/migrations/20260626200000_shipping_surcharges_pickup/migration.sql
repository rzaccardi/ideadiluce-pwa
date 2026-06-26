-- Gruppo 6: supplementi corriere, ritiro Roma, soglia spedizione gratuita 200€

ALTER TYPE "ShippingMethodType" ADD VALUE IF NOT EXISTS 'PICKUP';

CREATE TABLE "ShippingSurchargeConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "dhlBaseCents" INTEGER NOT NULL DEFAULT 500,
    "fedexBaseCents" INTEGER NOT NULL DEFAULT 400,
    "dhlLengthCents" INTEGER NOT NULL DEFAULT 1200,
    "lengthThresholdMeters" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingSurchargeConfig_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ShippingSurchargeConfig" ("id", "dhlBaseCents", "fedexBaseCents", "dhlLengthCents", "lengthThresholdMeters", "updatedAt")
VALUES ('default', 500, 400, 1200, 1.0, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

UPDATE "ShippingMethod"
SET "freeAboveCents" = 20000
WHERE "type" = 'FREE_SHIPPING' AND "freeAboveCents" = 15000;
