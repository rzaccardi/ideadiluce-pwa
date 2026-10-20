-- Avviso «sito precedente» spento di default (fine go-live)
ALTER TABLE "StorefrontSettings" ALTER COLUMN "legacySiteNoticeEnabled" SET DEFAULT false;

UPDATE "StorefrontSettings"
SET "legacySiteNoticeEnabled" = false
WHERE id = 'default';
