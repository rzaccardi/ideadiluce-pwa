-- AlterTable: notice legacy on by default (go-live)
ALTER TABLE "StorefrontSettings" ALTER COLUMN "legacySiteNoticeEnabled" SET DEFAULT true;

UPDATE "StorefrontSettings"
SET "legacySiteNoticeEnabled" = true
WHERE id = 'default' AND "legacySiteNoticeEnabled" = false;
