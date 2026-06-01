-- CreateEnum
CREATE TYPE "ShippingMethodType" AS ENUM ('FLAT_RATE', 'FREE_SHIPPING', 'LIVE_DHL', 'LIVE_FEDEX');

-- CreateEnum
CREATE TYPE "CarrierProvider" AS ENUM ('DHL', 'FEDEX');

-- AlterEnum
ALTER TYPE "PwaPaymentMethod" ADD VALUE 'STRIPE';

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countries" TEXT[],
    "postcodes" TEXT[],
    "priority" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShippingMethod" (
    "id" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ShippingMethodType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "flatAmountCents" INTEGER,
    "minOrderCents" INTEGER,
    "freeAboveCents" INTEGER,
    "surchargePct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarrierCredential" (
    "id" TEXT NOT NULL,
    "provider" "CarrierProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "sandbox" BOOLEAN NOT NULL DEFAULT true,
    "accountId" TEXT,
    "apiKey" TEXT,
    "apiSecret" TEXT,
    "extraJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CarrierCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CartShippingSelection" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "methodRef" TEXT NOT NULL,
    "carrierCode" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "etaDays" INTEGER,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartShippingSelection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShippingZone_enabled_idx" ON "ShippingZone"("enabled");

-- CreateIndex
CREATE INDEX "ShippingMethod_zoneId_idx" ON "ShippingMethod"("zoneId");

-- CreateIndex
CREATE INDEX "ShippingMethod_type_idx" ON "ShippingMethod"("type");

-- CreateIndex
CREATE UNIQUE INDEX "CarrierCredential_provider_key" ON "CarrierCredential"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "CartShippingSelection_cartId_key" ON "CartShippingSelection"("cartId");

-- AddForeignKey
ALTER TABLE "ShippingMethod" ADD CONSTRAINT "ShippingMethod_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ShippingZone"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CartShippingSelection" ADD CONSTRAINT "CartShippingSelection_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
