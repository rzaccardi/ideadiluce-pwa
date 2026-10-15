-- Overlay marchi catalogo (loghi light/dark + metadati BO)
CREATE TABLE IF NOT EXISTS "CatalogBrand" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT,
    "logoLightUrl" TEXT,
    "logoDarkUrl" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogBrand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CatalogBrand_slug_key" ON "CatalogBrand"("slug");
CREATE INDEX IF NOT EXISTS "CatalogBrand_hidden_idx" ON "CatalogBrand"("hidden");
CREATE INDEX IF NOT EXISTS "CatalogBrand_manual_idx" ON "CatalogBrand"("manual");
