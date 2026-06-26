-- CreateTable
CREATE TABLE "ProductDocumentDownload" (
    "id" TEXT NOT NULL,
    "productSlug" TEXT NOT NULL,
    "productRef" TEXT,
    "variantRef" TEXT,
    "documentId" TEXT NOT NULL,
    "documentName" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'IT',
    "sourcePage" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductDocumentDownload_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductDocumentDownload_productSlug_idx" ON "ProductDocumentDownload"("productSlug");

-- CreateIndex
CREATE INDEX "ProductDocumentDownload_documentId_idx" ON "ProductDocumentDownload"("documentId");

-- CreateIndex
CREATE INDEX "ProductDocumentDownload_createdAt_idx" ON "ProductDocumentDownload"("createdAt");

-- CreateIndex
CREATE INDEX "ProductDocumentDownload_userId_idx" ON "ProductDocumentDownload"("userId");
