-- StockRestockRequest: distingue RESTOCK_NOTIFY vs PRODUCT_REQUEST
ALTER TABLE "StockRestockRequest" ADD COLUMN IF NOT EXISTS "requestType" TEXT NOT NULL DEFAULT 'RESTOCK_NOTIFY';

DROP INDEX IF EXISTS "StockRestockRequest_email_productRef_variantRef_key";

CREATE UNIQUE INDEX IF NOT EXISTS "StockRestockRequest_email_productRef_variantRef_requestType_key"
  ON "StockRestockRequest"("email", "productRef", "variantRef", "requestType");

CREATE INDEX IF NOT EXISTS "StockRestockRequest_requestType_idx" ON "StockRestockRequest"("requestType");
