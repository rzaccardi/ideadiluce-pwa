-- Session: identity keyed by Odoo (partner / portal uid)
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
ALTER TABLE "Session" ADD COLUMN IF NOT EXISTS "odooUid" INTEGER;
CREATE INDEX IF NOT EXISTS "Session_odooPartnerId_idx" ON "Session"("odooPartnerId");

-- User: satellite projection of Odoo partner (not an independent auth directory)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "odooPartnerId" INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS "User_odooPartnerId_key" ON "User"("odooPartnerId");
CREATE INDEX IF NOT EXISTS "User_odooPartnerId_idx" ON "User"("odooPartnerId");
