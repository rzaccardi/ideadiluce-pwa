-- Professional account request: stati BO + note admin
ALTER TABLE "ProfessionalAccountRequest" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;

UPDATE "ProfessionalAccountRequest" SET "status" = 'NEW' WHERE "status" = 'pending';
UPDATE "ProfessionalAccountRequest" SET "status" = 'APPROVED' WHERE "status" = 'approved';
UPDATE "ProfessionalAccountRequest" SET "status" = 'REJECTED' WHERE "status" = 'rejected';

ALTER TABLE "ProfessionalAccountRequest" ALTER COLUMN "status" SET DEFAULT 'NEW';
