-- Gruppo 8: stati ordine checkout/Odoo e campi sync draft
ALTER TYPE "PwaOrderStatus" ADD VALUE 'DRAFT';
ALTER TYPE "PwaOrderStatus" ADD VALUE 'CHECKOUT_LOCKED';
ALTER TYPE "PwaOrderStatus" ADD VALUE 'PAID_SYNC_PENDING';
ALTER TYPE "PwaOrderStatus" ADD VALUE 'SYNCED';

ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "linesSnapshotJson" JSONB;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "clientOrderRef" TEXT;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "orderNotes" TEXT;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "courierNotes" TEXT;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "dropshipAddressJson" JSONB;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "fiscalJson" JSONB;
ALTER TABLE "PwaOrder" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "PwaOrder_idempotencyKey_key" ON "PwaOrder"("idempotencyKey");
