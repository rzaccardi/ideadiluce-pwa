-- Variant attribute translations + bulk translate jobs
CREATE TABLE "ProductVariantAttributeTranslation" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "locale" "Locale" NOT NULL DEFAULT 'IT',
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "deeplUpdatedAt" TIMESTAMP(3),

    CONSTRAINT "ProductVariantAttributeTranslation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductVariantAttributeTranslation_attributeId_locale_key" ON "ProductVariantAttributeTranslation"("attributeId", "locale");
CREATE INDEX "ProductVariantAttributeTranslation_attributeId_idx" ON "ProductVariantAttributeTranslation"("attributeId");

ALTER TABLE "ProductVariantAttributeTranslation" ADD CONSTRAINT "ProductVariantAttributeTranslation_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "ProductVariantAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "HubTranslateJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "translated" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "optionsJson" JSONB,
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "HubTranslateJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HubTranslateJob_status_idx" ON "HubTranslateJob"("status");
CREATE INDEX "HubTranslateJob_createdAt_idx" ON "HubTranslateJob"("createdAt");

-- Seed IT attribute translations from canonical attribute rows
INSERT INTO "ProductVariantAttributeTranslation" ("id", "attributeId", "locale", "name", "value")
SELECT gen_random_uuid()::text, a."id", 'IT'::"Locale", a."name", a."value"
FROM "ProductVariantAttribute" a
WHERE NOT EXISTS (
    SELECT 1 FROM "ProductVariantAttributeTranslation" t
    WHERE t."attributeId" = a."id" AND t."locale" = 'IT'
);
