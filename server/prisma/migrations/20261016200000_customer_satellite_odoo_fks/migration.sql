-- Migrate hub identity from User.id → odooPartnerId (CustomerSatellite).
-- Data-safe: backfill from User.odooPartnerId / OdooCustomerMap; synthetic negative ids for orphans.

-- ── 1. Ensure every User row has odooPartnerId ──────────────────────────────
UPDATE "User" u
SET "odooPartnerId" = m."odooPartnerId"
FROM (
  SELECT DISTINCT ON ("userId") "userId", "odooPartnerId"
  FROM "OdooCustomerMap"
  WHERE "userId" IS NOT NULL
  ORDER BY "userId", "updatedAt" DESC
) m
WHERE u.id = m."userId"
  AND u."odooPartnerId" IS NULL;

-- Synthetic negative partner ids for remaining orphans (local/dev rows without Odoo link)
WITH orphans AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") AS rn
  FROM "User"
  WHERE "odooPartnerId" IS NULL
),
min_neg AS (
  SELECT COALESCE(MIN("odooPartnerId"), 0) AS m FROM "User" WHERE "odooPartnerId" < 0
)
UPDATE "User" u
SET "odooPartnerId" = LEAST(min_neg.m, 0) - orphans.rn
FROM orphans, min_neg
WHERE u.id = orphans.id;

ALTER TABLE "User" ALTER COLUMN "odooPartnerId" SET NOT NULL;

-- ── 2. Rename User → CustomerSatellite ──────────────────────────────────────
ALTER TABLE "User" RENAME TO "CustomerSatellite";

ALTER INDEX IF EXISTS "User_email_key" RENAME TO "CustomerSatellite_email_key";
ALTER INDEX IF EXISTS "User_odooPartnerId_key" RENAME TO "CustomerSatellite_odooPartnerId_key";
ALTER INDEX IF EXISTS "User_email_idx" RENAME TO "CustomerSatellite_email_idx";
ALTER INDEX IF EXISTS "User_status_idx" RENAME TO "CustomerSatellite_status_idx";
ALTER INDEX IF EXISTS "User_customerSegment_idx" RENAME TO "CustomerSatellite_customerSegment_idx";
ALTER INDEX IF EXISTS "User_odooPartnerId_idx" RENAME TO "CustomerSatellite_odooPartnerId_idx";

-- Drop redundant odooPartnerId idx if unique already covers lookups (keep unique only)
DROP INDEX IF EXISTS "CustomerSatellite_odooPartnerId_idx";

-- ── 3. Helper: add odooPartnerId + backfill from old userId via CustomerSatellite ─
-- Session: already has odooPartnerId; prefer userId identity, clear orphans
UPDATE "Session" s
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE s."userId" = cs.id;

UPDATE "Session" s
SET "odooPartnerId" = NULL
WHERE s."odooPartnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerSatellite" cs WHERE cs."odooPartnerId" = s."odooPartnerId"
  );

ALTER TABLE "Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
DROP INDEX IF EXISTS "Session_userId_idx";
ALTER TABLE "Session" DROP COLUMN IF EXISTS "userId";

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- PasswordResetToken
ALTER TABLE "PasswordResetToken" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "PasswordResetToken" t
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE t."userId" = cs.id;

DELETE FROM "PasswordResetToken" WHERE "odooPartnerId" IS NULL;

ALTER TABLE "PasswordResetToken" ALTER COLUMN "odooPartnerId" SET NOT NULL;
ALTER TABLE "PasswordResetToken" DROP CONSTRAINT IF EXISTS "PasswordResetToken_userId_fkey";
DROP INDEX IF EXISTS "PasswordResetToken_userId_idx";
ALTER TABLE "PasswordResetToken" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "PasswordResetToken_odooPartnerId_idx" ON "PasswordResetToken"("odooPartnerId");
ALTER TABLE "PasswordResetToken"
  ADD CONSTRAINT "PasswordResetToken_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ImpersonationToken
ALTER TABLE "ImpersonationToken" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "ImpersonationToken" t
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE t."userId" = cs.id;

DELETE FROM "ImpersonationToken" WHERE "odooPartnerId" IS NULL;

ALTER TABLE "ImpersonationToken" ALTER COLUMN "odooPartnerId" SET NOT NULL;
ALTER TABLE "ImpersonationToken" DROP CONSTRAINT IF EXISTS "ImpersonationToken_userId_fkey";
DROP INDEX IF EXISTS "ImpersonationToken_userId_idx";
ALTER TABLE "ImpersonationToken" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "ImpersonationToken_odooPartnerId_idx" ON "ImpersonationToken"("odooPartnerId");
ALTER TABLE "ImpersonationToken"
  ADD CONSTRAINT "ImpersonationToken_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- OdooCustomerMap: drop userId, enforce unique odooPartnerId
-- Keep newest row per partner
DELETE FROM "OdooCustomerMap" a
USING "OdooCustomerMap" b
WHERE a."odooPartnerId" = b."odooPartnerId"
  AND a.id < b.id;

ALTER TABLE "OdooCustomerMap" DROP CONSTRAINT IF EXISTS "OdooCustomerMap_userId_fkey";
DROP INDEX IF EXISTS "OdooCustomerMap_userId_key";
ALTER TABLE "OdooCustomerMap" DROP COLUMN IF EXISTS "userId";
DROP INDEX IF EXISTS "OdooCustomerMap_odooPartnerId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "OdooCustomerMap_odooPartnerId_key" ON "OdooCustomerMap"("odooPartnerId");

-- Cart
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "Cart" c
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE c."userId" = cs.id;

UPDATE "Cart" c
SET "odooPartnerId" = NULL
WHERE c."odooPartnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerSatellite" cs WHERE cs."odooPartnerId" = c."odooPartnerId"
  );

ALTER TABLE "Cart" DROP CONSTRAINT IF EXISTS "Cart_userId_fkey";
DROP INDEX IF EXISTS "Cart_userId_idx";
ALTER TABLE "Cart" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "Cart_odooPartnerId_idx" ON "Cart"("odooPartnerId");
ALTER TABLE "Cart"
  ADD CONSTRAINT "Cart_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- UserNotification
ALTER TABLE "UserNotification" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "UserNotification" n
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE n."userId" = cs.id;

DELETE FROM "UserNotification" WHERE "odooPartnerId" IS NULL;

ALTER TABLE "UserNotification" ALTER COLUMN "odooPartnerId" SET NOT NULL;
ALTER TABLE "UserNotification" DROP CONSTRAINT IF EXISTS "UserNotification_userId_fkey";
DROP INDEX IF EXISTS "UserNotification_userId_createdAt_idx";
ALTER TABLE "UserNotification" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "UserNotification_odooPartnerId_createdAt_idx"
  ON "UserNotification"("odooPartnerId", "createdAt");
ALTER TABLE "UserNotification"
  ADD CONSTRAINT "UserNotification_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- QuoteRequest
ALTER TABLE "QuoteRequest" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "QuoteRequest" q
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE q."userId" = cs.id;

DELETE FROM "QuoteRequest" WHERE "odooPartnerId" IS NULL;

ALTER TABLE "QuoteRequest" ALTER COLUMN "odooPartnerId" SET NOT NULL;
ALTER TABLE "QuoteRequest" DROP CONSTRAINT IF EXISTS "QuoteRequest_userId_fkey";
DROP INDEX IF EXISTS "QuoteRequest_userId_idx";
ALTER TABLE "QuoteRequest" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "QuoteRequest_odooPartnerId_idx" ON "QuoteRequest"("odooPartnerId");
ALTER TABLE "QuoteRequest"
  ADD CONSTRAINT "QuoteRequest_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- OrderReturnRequest
ALTER TABLE "OrderReturnRequest" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "OrderReturnRequest" r
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE r."userId" = cs.id;

DELETE FROM "OrderReturnRequest" WHERE "odooPartnerId" IS NULL;

ALTER TABLE "OrderReturnRequest" ALTER COLUMN "odooPartnerId" SET NOT NULL;
ALTER TABLE "OrderReturnRequest" DROP CONSTRAINT IF EXISTS "OrderReturnRequest_userId_fkey";
DROP INDEX IF EXISTS "OrderReturnRequest_userId_orderId_key";
DROP INDEX IF EXISTS "OrderReturnRequest_userId_idx";
ALTER TABLE "OrderReturnRequest" DROP COLUMN IF EXISTS "userId";
CREATE UNIQUE INDEX IF NOT EXISTS "OrderReturnRequest_odooPartnerId_orderId_key"
  ON "OrderReturnRequest"("odooPartnerId", "orderId");
CREATE INDEX IF NOT EXISTS "OrderReturnRequest_odooPartnerId_idx" ON "OrderReturnRequest"("odooPartnerId");
ALTER TABLE "OrderReturnRequest"
  ADD CONSTRAINT "OrderReturnRequest_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- WishlistItem
ALTER TABLE "WishlistItem" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "WishlistItem" w
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE w."userId" = cs.id;

DELETE FROM "WishlistItem" w
WHERE w."odooPartnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerSatellite" cs WHERE cs."odooPartnerId" = w."odooPartnerId"
  );

ALTER TABLE "WishlistItem" DROP CONSTRAINT IF EXISTS "WishlistItem_userId_fkey";
DROP INDEX IF EXISTS "WishlistItem_userId_idx";
ALTER TABLE "WishlistItem" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "WishlistItem_odooPartnerId_idx" ON "WishlistItem"("odooPartnerId");
ALTER TABLE "WishlistItem"
  ADD CONSTRAINT "WishlistItem_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckoutSession: already has odooPartnerId; prefer userId identity, clear orphans
UPDATE "CheckoutSession" c
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE c."userId" = cs.id;

UPDATE "CheckoutSession" c
SET "odooPartnerId" = NULL
WHERE c."odooPartnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerSatellite" cs WHERE cs."odooPartnerId" = c."odooPartnerId"
  );

ALTER TABLE "CheckoutSession" DROP CONSTRAINT IF EXISTS "CheckoutSession_userId_fkey";
DROP INDEX IF EXISTS "CheckoutSession_userId_idx";
ALTER TABLE "CheckoutSession" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "CheckoutSession_odooPartnerId_idx" ON "CheckoutSession"("odooPartnerId");
ALTER TABLE "CheckoutSession" DROP CONSTRAINT IF EXISTS "CheckoutSession_odooPartnerId_fkey";
ALTER TABLE "CheckoutSession"
  ADD CONSTRAINT "CheckoutSession_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- PwaOrder: already has odooPartnerId; prefer userId identity, clear orphans
UPDATE "PwaOrder" o
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE o."userId" = cs.id;

UPDATE "PwaOrder" o
SET "odooPartnerId" = NULL
WHERE o."odooPartnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerSatellite" cs WHERE cs."odooPartnerId" = o."odooPartnerId"
  );

ALTER TABLE "PwaOrder" DROP CONSTRAINT IF EXISTS "PwaOrder_userId_fkey";
DROP INDEX IF EXISTS "PwaOrder_userId_idx";
ALTER TABLE "PwaOrder" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "PwaOrder_odooPartnerId_idx" ON "PwaOrder"("odooPartnerId");
ALTER TABLE "PwaOrder" DROP CONSTRAINT IF EXISTS "PwaOrder_odooPartnerId_fkey";
ALTER TABLE "PwaOrder"
  ADD CONSTRAINT "PwaOrder_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- OrderCache
ALTER TABLE "OrderCache" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "OrderCache" oc
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE oc."userId" = cs.id;

UPDATE "OrderCache" oc
SET "odooPartnerId" = NULL
WHERE oc."odooPartnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerSatellite" cs WHERE cs."odooPartnerId" = oc."odooPartnerId"
  );

ALTER TABLE "OrderCache" DROP CONSTRAINT IF EXISTS "OrderCache_userId_fkey";
DROP INDEX IF EXISTS "OrderCache_userId_idx";
ALTER TABLE "OrderCache" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "OrderCache_odooPartnerId_idx" ON "OrderCache"("odooPartnerId");
ALTER TABLE "OrderCache"
  ADD CONSTRAINT "OrderCache_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- TaxValidationLog
ALTER TABLE "TaxValidationLog" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;

UPDATE "TaxValidationLog" t
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE t."userId" = cs.id;

UPDATE "TaxValidationLog" t
SET "odooPartnerId" = NULL
WHERE t."odooPartnerId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "CustomerSatellite" cs WHERE cs."odooPartnerId" = t."odooPartnerId"
  );

ALTER TABLE "TaxValidationLog" DROP CONSTRAINT IF EXISTS "TaxValidationLog_userId_fkey";
DROP INDEX IF EXISTS "TaxValidationLog_userId_idx";
ALTER TABLE "TaxValidationLog" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "TaxValidationLog_odooPartnerId_idx" ON "TaxValidationLog"("odooPartnerId");
ALTER TABLE "TaxValidationLog"
  ADD CONSTRAINT "TaxValidationLog_odooPartnerId_fkey"
  FOREIGN KEY ("odooPartnerId") REFERENCES "CustomerSatellite"("odooPartnerId")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Soft refs (no FK): rename userId → odooPartnerId (Int), best-effort backfill
-- OdooSyncQueue
ALTER TABLE "OdooSyncQueue" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
UPDATE "OdooSyncQueue" q
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE q."userId" = cs.id
  AND q."odooPartnerId" IS NULL;
DROP INDEX IF EXISTS "OdooSyncQueue_userId_idx";
ALTER TABLE "OdooSyncQueue" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "OdooSyncQueue_odooPartnerId_idx" ON "OdooSyncQueue"("odooPartnerId");

-- AbandonedCartEvent
ALTER TABLE "AbandonedCartEvent" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
UPDATE "AbandonedCartEvent" e
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE e."userId" = cs.id
  AND e."odooPartnerId" IS NULL;
DROP INDEX IF EXISTS "AbandonedCartEvent_userId_idx";
ALTER TABLE "AbandonedCartEvent" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "AbandonedCartEvent_odooPartnerId_idx" ON "AbandonedCartEvent"("odooPartnerId");

-- ProductDocumentDownload
ALTER TABLE "ProductDocumentDownload" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
UPDATE "ProductDocumentDownload" d
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE d."userId" = cs.id
  AND d."odooPartnerId" IS NULL;
DROP INDEX IF EXISTS "ProductDocumentDownload_userId_idx";
ALTER TABLE "ProductDocumentDownload" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "ProductDocumentDownload_odooPartnerId_idx" ON "ProductDocumentDownload"("odooPartnerId");

-- CatalogSearchEvent
ALTER TABLE "CatalogSearchEvent" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
UPDATE "CatalogSearchEvent" e
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE e."userId" = cs.id
  AND e."odooPartnerId" IS NULL;
DROP INDEX IF EXISTS "CatalogSearchEvent_userId_idx";
ALTER TABLE "CatalogSearchEvent" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "CatalogSearchEvent_odooPartnerId_idx" ON "CatalogSearchEvent"("odooPartnerId");

-- NotFoundHit
ALTER TABLE "NotFoundHit" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
UPDATE "NotFoundHit" h
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE h."userId" = cs.id
  AND h."odooPartnerId" IS NULL;
ALTER TABLE "NotFoundHit" DROP COLUMN IF EXISTS "userId";

-- StockRestockRequest
ALTER TABLE "StockRestockRequest" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
UPDATE "StockRestockRequest" r
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE r."userId" = cs.id
  AND r."odooPartnerId" IS NULL;
ALTER TABLE "StockRestockRequest" DROP COLUMN IF EXISTS "userId";

-- ProfessionalAccountRequest: already has odooPartnerId; drop legacy userId after backfill
UPDATE "ProfessionalAccountRequest" r
SET "odooPartnerId" = cs."odooPartnerId"
FROM "CustomerSatellite" cs
WHERE r."userId" = cs.id
  AND r."odooPartnerId" IS NULL;
ALTER TABLE "ProfessionalAccountRequest" DROP COLUMN IF EXISTS "userId";
CREATE INDEX IF NOT EXISTS "ProfessionalAccountRequest_odooPartnerId_idx"
  ON "ProfessionalAccountRequest"("odooPartnerId");
