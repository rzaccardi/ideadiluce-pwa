-- AlterTable
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "odooSaleOrderName" TEXT;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "odooShippingAddressId" INTEGER;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "odooInvoiceAddressId" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PwaOrder_odooSaleOrderName_idx" ON "PwaOrder"("odooSaleOrderName");
