-- AlterTable: ripristina default legacy URL su old.ideadiluce.com
ALTER TABLE "StorefrontSettings" ALTER COLUMN "legacySiteUrl" SET DEFAULT 'https://old.ideadiluce.com/';

UPDATE "StorefrontSettings"
SET "legacySiteUrl" = 'https://old.ideadiluce.com/'
WHERE "legacySiteUrl" IN (
  'https://old.ideadiluce.it',
  'https://old.ideadiluce.it/',
  'https://old.ideadiluce.com'
);
