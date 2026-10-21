-- Reset password gestito da Odoo API v2: token locali non più usati
DROP TABLE IF EXISTS "PasswordResetToken";
