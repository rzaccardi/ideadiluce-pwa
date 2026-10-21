-- AlterTable: riattiva avviso go-live verso il sito precedente
ALTER TABLE "StorefrontSettings" ALTER COLUMN "legacySiteNoticeEnabled" SET DEFAULT true;

UPDATE "StorefrontSettings"
SET "legacySiteNoticeEnabled" = true
WHERE id = 'default' AND "legacySiteNoticeEnabled" = false;
