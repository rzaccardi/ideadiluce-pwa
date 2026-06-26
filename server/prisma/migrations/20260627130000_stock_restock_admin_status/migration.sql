-- Workflow operativo BO per richieste restock / richiesta prodotto
ALTER TABLE "StockRestockRequest" ADD COLUMN "adminStatus" TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE "StockRestockRequest" ADD COLUMN "adminNotes" TEXT;

CREATE INDEX "StockRestockRequest_adminStatus_idx" ON "StockRestockRequest"("adminStatus");
