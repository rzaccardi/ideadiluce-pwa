-- CreateTable
CREATE TABLE "StorefrontSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "soundsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorefrontSettings_pkey" PRIMARY KEY ("id")
);
