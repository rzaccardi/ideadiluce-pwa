-- CreateTable
CREATE TABLE "SitePage" (
    "id" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'IT',
    "content" JSONB NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SitePage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SitePage_pageKey_locale_key" ON "SitePage"("pageKey", "locale");

-- CreateIndex
CREATE INDEX "SitePage_pageKey_idx" ON "SitePage"("pageKey");
