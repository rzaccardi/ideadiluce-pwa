-- CreateTable
CREATE TABLE "MerchantCenterSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "includeOutOfStock" BOOLEAN NOT NULL DEFAULT true,
    "expandVariants" BOOLEAN NOT NULL DEFAULT false,
    "googleProductCategory" TEXT NOT NULL DEFAULT '594',
    "shippingCountry" TEXT NOT NULL DEFAULT 'IT',
    "shippingPriceCents" INTEGER,
    "brandFallback" TEXT NOT NULL DEFAULT 'Idea di Luce',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantCenterSettings_pkey" PRIMARY KEY ("id")
);
