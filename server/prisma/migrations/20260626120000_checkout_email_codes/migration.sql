-- CreateTable
CREATE TABLE "CheckoutEmailCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CheckoutEmailCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CheckoutEmailCode_email_idx" ON "CheckoutEmailCode"("email");

-- CreateIndex
CREATE INDEX "CheckoutEmailCode_expiresAt_idx" ON "CheckoutEmailCode"("expiresAt");
