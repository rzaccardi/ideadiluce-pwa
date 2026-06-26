-- Campi tracking aggiuntivi (idempotente)
ALTER TABLE "ProductDocumentDownload" ADD COLUMN IF NOT EXISTS "variantRef" TEXT;
ALTER TABLE "ProductDocumentDownload" ADD COLUMN IF NOT EXISTS "userAgent" TEXT;
ALTER TABLE "ProductDocumentDownload" ADD COLUMN IF NOT EXISTS "success" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ProductDocumentDownload" ADD COLUMN IF NOT EXISTS "errorMessage" TEXT;
