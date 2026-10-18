/**
 * Elenca (e con --disable disattiva) i mail.template nativi sale.order
 * che competono con [PWA] Conferma ordine.
 *
 *   cd server && npx tsx scripts/audit-odoo-order-mails.ts
 *   cd server && npx tsx scripts/audit-odoo-order-mails.ts --disable
 */
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { isOdooConfigured, odooExecuteKw } from '../src/adapters/odoo/odooClient.js'
import { env } from '../src/config/env.js'

loadDotenv({ path: resolve(process.cwd(), '../.env') })
loadDotenv({ path: resolve(process.cwd(), '.env') })

const PWA_PREFIX = '[PWA]'

type TemplateRow = {
  id: number
  name: string
  model: string
  subject: string | false
  active: boolean
  email_from: string | false
}

function isPwaTemplate(name: string): boolean {
  return name.trim().startsWith(PWA_PREFIX)
}

/** Template nativi tipici di conferma ordine (Odoo Sales / website). */
function looksLikeNativeOrderConfirmation(row: TemplateRow): boolean {
  if (isPwaTemplate(row.name)) return false
  if (row.model !== 'sale.order') return false
  const hay = `${row.name} ${typeof row.subject === 'string' ? row.subject : ''}`.toLowerCase()
  if (hay.includes('quotation') || hay.includes('preventivo') || hay.includes('proforma')) return false
  if (hay.includes('cancellation') || hay.includes('annullamento')) return false
  return (
    hay.includes('order confirmation') ||
    hay.includes('sales: order confirmation') ||
    hay.includes('sales: payment done') ||
    hay.includes('payment done') ||
    hay.includes('conferma pagamento') ||
    hay.includes('sales: send order') ||
    hay.includes('sales order: send by email') ||
    hay.includes('conferma ordine') ||
    hay.includes('ordine confermato') ||
    (hay.includes('send order') && hay.includes('email')) ||
    (hay.includes('confirmation') && hay.includes('order'))
  )
}

async function main() {
  const disable = process.argv.includes('--disable')
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    throw new Error('Odoo non configurato')
  }
  const ctx = { correlationId: `audit-odoo-order-mails-${Date.now()}` }

  const templates = await odooExecuteKw<TemplateRow[]>(
    ctx,
    'mail.template',
    'search_read',
    [[['model', '=', 'sale.order']]],
    { fields: ['id', 'name', 'model', 'subject', 'active', 'email_from'], limit: 200 },
  )

  console.log('=== Tutti i mail.template su sale.order (%d) ===', templates.length)
  for (const t of templates) {
    const mark = isPwaTemplate(t.name) ? 'PWA' : looksLikeNativeOrderConfirmation(t) ? 'NATIVE?' : 'other'
    console.log(
      '[%s] id=%s active=%s name=%s subject=%s from=%s',
      mark,
      t.id,
      t.active,
      t.name,
      t.subject || '-',
      t.email_from || '-',
    )
  }

  const natives = templates.filter((t) => t.active && looksLikeNativeOrderConfirmation(t))
  console.log('\n=== Candidati da disattivare (%d) ===', natives.length)
  for (const t of natives) {
    console.log('  id=%s name=%s', t.id, t.name)
  }

  if (disable && natives.length) {
    const ids = natives.map((t) => t.id)
    await odooExecuteKw(ctx, 'mail.template', 'write', [ids, { active: false }], {})
    console.log('\nDisattivati %d template: %s', ids.length, ids.join(', '))
  } else if (disable) {
    console.log('\nNessun template nativo attivo da disattivare.')
  } else {
    console.log('\nRiesegui con --disable per impostare active=false sui candidati.')
  }

  try {
    const automations = await odooExecuteKw<
      Array<{ id: number; name: string; active: boolean; trigger: string }>
    >(
      ctx,
      'base.automation',
      'search_read',
      [[['model_id.model', '=', 'sale.order']]],
      { fields: ['id', 'name', 'active', 'trigger'], limit: 100 },
    )
    console.log('\n=== base.automation su sale.order (%d) ===', automations.length)
    for (const a of automations) {
      console.log('  id=%s active=%s trigger=%s name=%s', a.id, a.active, a.trigger, a.name)
    }
  } catch (e) {
    console.log('\nbase.automation non leggibile:', e instanceof Error ? e.message : e)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
