/**
 * Smoke: crea una mail.mail [PWA] collegata a sale.order (model/res_id)
 * e verifica che i campi chatter siano valorizzati su Odoo staging.
 *
 * Uso:
 *   cd server && npx tsx scripts/smoke-order-mail-chatter.ts
 *   cd server && npx tsx scripts/smoke-order-mail-chatter.ts --sale-order-id 123
 *   cd server && npx tsx scripts/smoke-order-mail-chatter.ts --to tu@email.it --send
 *
 * Senza --send: crea il record in stato outgoing (appare nel chatter) senza SMTP.
 */
import { config as loadDotenv } from 'dotenv'
import { resolve } from 'node:path'
import { env } from '../src/config/env.js'
import {
  buildOdooMailWebUrl,
  isOdooConfigured,
  odooExecuteKw,
} from '../src/adapters/odoo/odooClient.js'
import {
  buildPwaMailHeaders,
  PWA_MAIL_TEMPLATES,
  renderPwaMailPlaceholders,
} from '../src/adapters/odoo/odoo-mail.templates.js'
import { normalizeOdooCreateId } from '../src/adapters/odoo/odooId.js'
import { resolvePwaMailFrom, sendPwaMail } from '../src/adapters/odoo/odooMailAdapter.js'

loadDotenv({ path: resolve(process.cwd(), '../.env') })
loadDotenv({ path: resolve(process.cwd(), '.env') })

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  if (i < 0) return undefined
  const v = process.argv[i + 1]
  return v && !v.startsWith('--') ? v : undefined
}

async function resolveSaleOrderId(ctx: { correlationId: string }): Promise<{
  id: number
  name: string
  partnerEmail: string | null
}> {
  const forced = argValue('--sale-order-id')
  if (forced) {
    const id = Number(forced)
    if (!Number.isFinite(id) || id <= 0) throw new Error(`--sale-order-id non valido: ${forced}`)
    const rows = await odooExecuteKw<Array<{ id: number; name: string; partner_id: [number, string] | false }>>(
      ctx,
      'sale.order',
      'read',
      [[id]],
      { fields: ['id', 'name', 'partner_id'] },
    )
    const row = rows[0]
    if (!row) throw new Error(`sale.order ${id} non trovato`)
    let partnerEmail: string | null = null
    if (row.partner_id) {
      const partners = await odooExecuteKw<Array<{ email: string | false }>>(
        ctx,
        'res.partner',
        'read',
        [[row.partner_id[0]]],
        { fields: ['email'] },
      )
      const email = partners[0]?.email
      partnerEmail = typeof email === 'string' && email.includes('@') ? email : null
    }
    return { id: row.id, name: row.name, partnerEmail }
  }

  const rows = await odooExecuteKw<Array<{ id: number; name: string }>>(
    ctx,
    'sale.order',
    'search_read',
    [[['state', 'in', ['sale', 'done', 'draft', 'sent']]]],
    { fields: ['id', 'name'], order: 'id desc', limit: 1 },
  )
  const row = rows[0]
  if (!row) throw new Error('Nessun sale.order trovato in Odoo')
  return { id: row.id, name: row.name, partnerEmail: null }
}

async function main() {
  if (!isOdooConfigured()) {
    throw new Error('Odoo non configurato (.env: ODOO_ENABLED/URL/DB/USER/PASSWORD)')
  }

  const doSend = process.argv.includes('--send')
  const toArg = argValue('--to')
  const ctx = { correlationId: `smoke-mail-chatter-${Date.now()}` }
  const so = await resolveSaleOrderId(ctx)
  const emailTo = (toArg || so.partnerEmail || 'pwa-chatter-smoke@ideadiluce.com').toLowerCase().trim()

  console.log('Odoo:', env.ODOO_URL || env.ODOO_XMLRPC_URL)
  console.log('sale.order:', so.id, so.name)
  console.log('email_to:', emailTo)
  console.log('mode:', doSend ? 'send (SMTP via Odoo)' : 'create only (no send)')

  if (doSend) {
    await sendPwaMail(ctx, {
      templateKey: 'order_confirmation',
      emailTo,
      record: { model: 'sale.order', resId: so.id },
      vars: {
        first_name_suffix: '',
        order_number: so.name,
        amount: '€ 0.00',
        order_url: `${(env.PUBLIC_SITE_URL || 'https://www.ideadiluce.com').replace(/\/$/, '')}/account/orders/${so.name}`,
      },
    })
    console.log('sendPwaMail OK — controlla chatter SO e mail-log admin')
    return
  }

  const def = PWA_MAIL_TEMPLATES.order_confirmation
  const vars = {
    first_name_suffix: '',
    order_number: so.name,
    amount: '€ 0.00',
    order_url: 'https://www.ideadiluce.com/account/orders/smoke',
  }
  const subject = `[SMOKE chatter] ${renderPwaMailPlaceholders(def.subject, vars, 'text')}`
  const bodyHtml = renderPwaMailPlaceholders(def.bodyHtml, vars, 'html')

  const created = await odooExecuteKw<unknown>(
    ctx,
    'mail.mail',
    'create',
    [
      {
        email_to: emailTo,
        email_from: resolvePwaMailFrom(),
        subject,
        body_html: bodyHtml,
        body: `Smoke chatter link SO ${so.name}`,
        auto_delete: false,
        model: 'sale.order',
        res_id: so.id,
        headers: buildPwaMailHeaders('order_confirmation'),
      },
    ],
    {},
  )
  const mailId = normalizeOdooCreateId(created)

  const rows = await odooExecuteKw<
    Array<{ id: number; model: string | false; res_id: number; state: string; subject: string }>
  >(ctx, 'mail.mail', 'read', [[mailId]], {
    fields: ['id', 'model', 'res_id', 'state', 'subject'],
  })
  const mail = rows[0]
  if (!mail) throw new Error(`mail.mail ${mailId} non leggibile dopo create`)

  const ok = mail.model === 'sale.order' && mail.res_id === so.id
  console.log('mail.mail:', mail)
  console.log('mail url:', buildOdooMailWebUrl(String(env.ODOO_URL || env.ODOO_XMLRPC_URL), mailId))
  console.log(
    'so url:',
    `${String(env.ODOO_URL || env.ODOO_XMLRPC_URL).replace(/\/$/, '')}/web#id=${so.id}&model=sale.order&view_type=form`,
  )
  if (!ok) {
    throw new Error(`FAIL: atteso model=sale.order res_id=${so.id}, got model=${mail.model} res_id=${mail.res_id}`)
  }
  console.log('OK: mail collegata al sale.order — apri il chatter dell’ordine in Odoo')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
