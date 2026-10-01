/**
 * Crea (e opzionalmente aggiorna) i mail.template `[PWA] …` in Odoo dal seed.
 *
 * Uso:
 *   cd server && npx tsx scripts/sync-pwa-mail-templates.ts
 *   cd server && npx tsx scripts/sync-pwa-mail-templates.ts --update
 */
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { ensureAllPwaMailTemplates, resetOdooMailTemplateCache } from '../src/adapters/odoo/odooMailAdapter.js'

loadDotenv({ path: resolve(process.cwd(), '../.env') })
loadDotenv({ path: resolve(process.cwd(), '.env') })

async function main() {
  const updateExisting = process.argv.includes('--update')
  resetOdooMailTemplateCache()
  const rows = await ensureAllPwaMailTemplates(
    { correlationId: `sync-pwa-mail-${Date.now()}` },
    { updateExisting },
  )
  const target = rows.find((r) => r.key === 'professional_request_customer')
  console.log(
    'Synced %d PWA mail templates (updateExisting=%s)',
    rows.length,
    updateExisting,
  )
  for (const row of rows) {
    console.log('  %s → id=%s name=%s', row.key, row.id, row.name)
  }
  if (!target) {
    throw new Error('Template professional_request_customer assente dopo sync')
  }
  console.log('OK professional_request_customer id=%s', target.id)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
