-- CreateEnum
CREATE TYPE "PwaOrderStatus" AS ENUM ('CART_CREATED', 'CHECKOUT_STARTED', 'PAYMENT_STARTED', 'PAYMENT_PENDING', 'PAID', 'PAYMENT_FAILED', 'ABANDONED', 'CANCELLED', 'CONFIRMED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PwaPaymentStatus" AS ENUM ('NOT_STARTED', 'CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PwaPaymentMethod" AS ENUM ('CARD_NEXI', 'BANK_TRANSFER', 'PAYPAL', 'GOOGLE_PAY');

-- CreateTable
CREATE TABLE "PwaOrder" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "checkoutSessionId" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "email" TEXT NOT NULL,
    "orderStatus" "PwaOrderStatus" NOT NULL DEFAULT 'CART_CREATED',
    "paymentStatus" "PwaPaymentStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "paymentMethod" "PwaPaymentMethod",
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "amountTotal" INTEGER,
    "billingAddressJson" JSONB,
    "shippingAddressJson" JSONB,
    "odooPartnerId" INTEGER,
    "odooSaleOrderId" INTEGER,
    "providerTransactionId" TEXT,
    "lastPaymentError" TEXT,
    "checkoutStartedAt" TIMESTAMP(3),
    "paymentStartedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "odooLastSyncAt" TIMESTAMP(3),
    "odooLastSyncStatus" "OdooSyncStatus" NOT NULL DEFAULT 'PENDING',
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PwaOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PwaPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "method" "PwaPaymentMethod" NOT NULL,
    "status" "PwaPaymentStatus" NOT NULL DEFAULT 'CREATED',
    "provider" TEXT NOT NULL,
    "providerSessionId" TEXT,
    "providerTransactionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'EUR',
    "redirectUrl" TEXT,
    "clientSecret" TEXT,
    "instructionsJson" JSONB,
    "failureReason" TEXT,
    "rawProviderJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorizedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "PwaPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PwaOrder_checkoutSessionId_key" ON "PwaOrder"("checkoutSessionId");

-- CreateIndex
CREATE INDEX "PwaOrder_cartId_idx" ON "PwaOrder"("cartId");

-- CreateIndex
CREATE INDEX "PwaOrder_userId_idx" ON "PwaOrder"("userId");

-- CreateIndex
CREATE INDEX "PwaOrder_sessionId_idx" ON "PwaOrder"("sessionId");

-- CreateIndex
CREATE INDEX "PwaOrder_orderStatus_idx" ON "PwaOrder"("orderStatus");

-- CreateIndex
CREATE INDEX "PwaOrder_paymentStatus_idx" ON "PwaOrder"("paymentStatus");

-- CreateIndex
CREATE INDEX "PwaOrder_odooSaleOrderId_idx" ON "PwaOrder"("odooSaleOrderId");

-- CreateIndex
CREATE INDEX "PwaPayment_orderId_idx" ON "PwaPayment"("orderId");

-- CreateIndex
CREATE INDEX "PwaPayment_status_idx" ON "PwaPayment"("status");

-- CreateIndex
CREATE INDEX "PwaPayment_provider_providerTransactionId_idx" ON "PwaPayment"("provider", "providerTransactionId");

-- AddForeignKey
ALTER TABLE "PwaOrder" ADD CONSTRAINT "PwaOrder_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwaOrder" ADD CONSTRAINT "PwaOrder_checkoutSessionId_fkey" FOREIGN KEY ("checkoutSessionId") REFERENCES "CheckoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwaOrder" ADD CONSTRAINT "PwaOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwaOrder" ADD CONSTRAINT "PwaOrder_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PwaPayment" ADD CONSTRAINT "PwaPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "PwaOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
