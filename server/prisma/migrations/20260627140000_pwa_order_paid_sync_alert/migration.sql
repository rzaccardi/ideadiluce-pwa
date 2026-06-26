-- Alert operativo ordini pagati ma sync Odoo in attesa
ALTER TABLE "PwaOrder" ADD COLUMN "paidSyncAlertSentAt" TIMESTAMP(3);
