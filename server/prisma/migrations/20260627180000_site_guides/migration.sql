-- CreateTable
CREATE TABLE "SiteGuide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '',
    "readingMeta" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "indexed" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteGuide_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteGuide_slug_key" ON "SiteGuide"("slug");

-- CreateIndex
CREATE INDEX "SiteGuide_sortOrder_idx" ON "SiteGuide"("sortOrder");

-- CreateIndex
CREATE INDEX "SiteGuide_published_indexed_idx" ON "SiteGuide"("published", "indexed");
