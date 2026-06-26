-- AlterTable
ALTER TABLE "User" ADD COLUMN "shippingAddressJson" JSONB;
ALTER TABLE "User" ADD COLUMN "preferredPaymentMethod" "PwaPaymentMethod";
