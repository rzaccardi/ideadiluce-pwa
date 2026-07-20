-- Legacy Product Hub catalog (moved out of server DB; catalog lives on Odoo/OdooCatalog).
-- Safe on fresh DBs: IF EXISTS on all drops.

DROP TABLE IF EXISTS "ProductPriceHistory" CASCADE;
DROP TABLE IF EXISTS "OdooCatalogSync" CASCADE;
DROP TABLE IF EXISTS "ExternalProductRef" CASCADE;
DROP TABLE IF EXISTS "ProductSEOTranslation" CASCADE;
DROP TABLE IF EXISTS "ProductSEO" CASCADE;
DROP TABLE IF EXISTS "ProductTranslation" CASCADE;
DROP TABLE IF EXISTS "ProductTechnicalSpec" CASCADE;
DROP TABLE IF EXISTS "ProductCategory" CASCADE;
DROP TABLE IF EXISTS "ProductMedia" CASCADE;
DROP TABLE IF EXISTS "ProductVariantAttributeTranslation" CASCADE;
DROP TABLE IF EXISTS "ProductVariantAttribute" CASCADE;
DROP TABLE IF EXISTS "ProductVariant" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "HubTranslateJob" CASCADE;
DROP TABLE IF EXISTS "Brand" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "WooImportRun" CASCADE;
DROP TABLE IF EXISTS "UrlRedirect" CASCADE;

DROP TYPE IF EXISTS "OdooCatalogSyncStatus";
DROP TYPE IF EXISTS "MediaKind";
DROP TYPE IF EXISTS "TaxonomyKind";
DROP TYPE IF EXISTS "ExternalSystem";
DROP TYPE IF EXISTS "ProductVisibility";
DROP TYPE IF EXISTS "ProductStatus";
DROP TYPE IF EXISTS "Locale";
