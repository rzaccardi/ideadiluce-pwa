-- AlterTable
ALTER TABLE "StorefrontSettings" ALTER COLUMN "legacySiteUrl" SET DEFAULT 'https://old.ideadiluce.it';

UPDATE "StorefrontSettings"
SET "legacySiteUrl" = 'https://old.ideadiluce.it'
WHERE "legacySiteUrl" IN (
  'https://old.ideadiluce.com',
  'https://old.ideadiluce.com/'
);
