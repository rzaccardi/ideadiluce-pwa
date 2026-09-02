-- AlterTable
ALTER TABLE "StorefrontSettings" ADD COLUMN "legacySiteNoticeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "StorefrontSettings" ADD COLUMN "legacySiteUrl" TEXT NOT NULL DEFAULT 'https://old.ideadiluce.com';
