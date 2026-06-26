-- Professional account: VAT/Odoo sync metadata
ALTER TABLE "ProfessionalAccountRequest" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'IT';
ALTER TABLE "ProfessionalAccountRequest" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
ALTER TABLE "ProfessionalAccountRequest" ADD COLUMN IF NOT EXISTS "vatValidated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProfessionalAccountRequest" ADD COLUMN IF NOT EXISTS "vatForceAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProfessionalAccountRequest" ADD COLUMN IF NOT EXISTS "odooSyncError" TEXT;
