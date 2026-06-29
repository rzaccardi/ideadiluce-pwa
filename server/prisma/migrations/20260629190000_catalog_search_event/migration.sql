-- CreateTable
CREATE TABLE "CatalogSearchEvent" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalizedQuery" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'IT',
    "source" TEXT NOT NULL DEFAULT 'inline',
    "action" TEXT NOT NULL DEFAULT 'submit',
    "resultCount" INTEGER,
    "productTotal" INTEGER,
    "clickedPath" TEXT,
    "clickedKind" TEXT,
    "clickedLabel" TEXT,
    "userId" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CatalogSearchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogSearchEvent_normalizedQuery_idx" ON "CatalogSearchEvent"("normalizedQuery");

-- CreateIndex
CREATE INDEX "CatalogSearchEvent_locale_idx" ON "CatalogSearchEvent"("locale");

-- CreateIndex
CREATE INDEX "CatalogSearchEvent_source_idx" ON "CatalogSearchEvent"("source");

-- CreateIndex
CREATE INDEX "CatalogSearchEvent_action_idx" ON "CatalogSearchEvent"("action");

-- CreateIndex
CREATE INDEX "CatalogSearchEvent_createdAt_idx" ON "CatalogSearchEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CatalogSearchEvent_userId_idx" ON "CatalogSearchEvent"("userId");
