-- ProductTranslation + SEO admin flags
CREATE TABLE "ProductTranslation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'IT',
    "name" TEXT,
    "shortDescription" TEXT,
    "longDescription" TEXT,
    "deeplUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");
CREATE INDEX "ProductTranslation_productId_idx" ON "ProductTranslation"("productId");

ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductSEO" ADD COLUMN "inSitemap" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ProductSEOTranslation" ADD COLUMN "localeEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "ProductSEOTranslation" ADD COLUMN "deeplUpdatedAt" TIMESTAMP(3);

-- Seed IT translations from product + existing SEO (Italian source of truth)
INSERT INTO "ProductTranslation" ("id", "productId", "locale", "name", "shortDescription", "longDescription", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    p."id",
    'IT'::"Locale",
    COALESCE(
        (SELECT t."metaTitle" FROM "ProductSEOTranslation" t
         INNER JOIN "ProductSEO" s ON s."id" = t."productSEOId"
         WHERE s."productId" = p."id" AND t."locale" = 'IT' LIMIT 1),
        replace(p."slug", '-', ' ')
    ),
    p."shortDescription",
    p."longDescription",
    NOW(),
    NOW()
FROM "Product" p
WHERE NOT EXISTS (
    SELECT 1 FROM "ProductTranslation" pt
    WHERE pt."productId" = p."id" AND pt."locale" = 'IT'
);
