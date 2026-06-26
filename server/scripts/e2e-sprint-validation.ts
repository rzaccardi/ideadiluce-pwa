/**
 * Validazione E2E sprint preventivi / professional / ritiro / IVA.
 * Uso: cd server && ODOO_ENABLED=true npx tsx scripts/e2e-sprint-validation.ts
 */
import { getStorePickupLocation } from '../src/config/store-location.js'
import { env } from '../src/config/env.js'
import { isOdooConfigured, odooExecuteKw } from '../src/adapters/odoo/odooClient.js'
import { resolveOdooQuotePayability } from '../src/modules/quotes/quote-payability.js'
import { vatValidationService } from '../src/modules/tax/vat-validation.service.js'
import { odooSalesService } from '../src/modules/odoo/odoo-sales.service.js'

const API_BASE = (process.env.API_BASE ?? 'http://localhost:4000').replace(/\/$/, '')
const TEST_VAT = process.env.E2E_TEST_VAT ?? 'IT17245551001'

const jar = new Map<string, string>()

function parseSetCookie(headers: Headers) {
  for (const c of headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const eq = pair.indexOf('=')
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

type Result = { name: string; ok: boolean; note?: string }

const results: Result[] = []

function pass(name: string, note?: string) {
  results.push({ name, ok: true, note })
  console.log('OK  ', name, note ?? '')
}

function fail(name: string, note?: string) {
  results.push({ name, ok: false, note })
  console.log('FAIL', name, note ?? '')
}

async function api(path: string, init?: RequestInit) {
  const headers: Record<string, string> = { Accept: 'application/json', ...(init?.headers as Record<string, string> | undefined) }
  if (cookieHeader()) headers.Cookie = cookieHeader()
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  parseSetCookie(res.headers)
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text.slice(0, 200) }
  }
  return { status: res.status, json }
}

async function main() {
  console.log('=== E2E Sprint Validation ===\n')
  console.log(`API_BASE=${API_BASE}`)
  console.log(`ODOO_ENABLED=${env.ODOO_ENABLED} configured=${isOdooConfigured()}\n`)

  // —— Unit: payability ——
  const sentOk = resolveOdooQuotePayability({ state: 'sent', validityDate: '2099-12-31' })
  sentOk.payable ? pass('payability: sent valido') : fail('payability: sent valido')

  const expired = resolveOdooQuotePayability({ state: 'sent', validityDate: '2020-01-01' })
  expired.reason === 'expired' && !expired.payable
    ? pass('payability: sent scaduto')
    : fail('payability: sent scaduto', expired.reason)

  const cancelled = resolveOdooQuotePayability({ state: 'cancel' })
  cancelled.reason === 'cancelled' ? pass('payability: cancelled') : fail('payability: cancelled')

  // —— Config ritiro ——
  const pickup = getStorePickupLocation()
  pickup.line1.includes('Pignatelli')
    ? pass('store pickup', pickup.displayAddress)
    : fail('store pickup', pickup.displayAddress)

  // —— API health + footer ——
  const health = await api('/health')
  health.status === 200 ? pass('API health') : fail('API health', String(health.status))

  const chiSiamo = await api('/api/v1/site/pages/chi-siamo?locale=IT')
  const blocks = (chiSiamo.json as { data?: { content?: { blocks?: { kind?: string; address?: string }[] } } })
    ?.data?.content?.blocks
  const contact = blocks?.find((b) => b.kind === 'contact')
  contact?.address?.includes(pickup.line1)
    ? pass('contatti indirizzo allineato', contact.address)
    : fail('contatti indirizzo allineato', contact?.address ?? 'missing')

  // —— VIES ——
  try {
    const vat = await vatValidationService.checkOnce(TEST_VAT, 'IT')
    vat.valid ? pass('VIES P.IVA test', vat.vatNumber) : fail('VIES P.IVA test', 'non valida')
  } catch (e) {
    fail('VIES P.IVA test', e instanceof Error ? e.message : String(e))
  }

  // —— Odoo XML-RPC ——
  if (env.ODOO_ENABLED && isOdooConfigured()) {
    const ctx = { correlationId: 'e2e-sprint-validation' }
    try {
      const uid = await odooExecuteKw<number>(ctx, 'res.users', 'search', [[['login', '=', env.ODOO_USERNAME]]], {
        limit: 1,
      })
      uid.length > 0 ? pass('Odoo XML-RPC auth') : fail('Odoo XML-RPC auth', 'user not found')
    } catch (e) {
      fail('Odoo XML-RPC auth', e instanceof Error ? e.message : String(e))
    }

    try {
      const quotes = await odooSalesService.listQuotations(ctx, { page: 1, pageSize: 5, state: 'sent' })
      const items = quotes.items ?? []
      pass('Odoo list quotations (sent)', `${items.length} trovati`)
      if (items.length > 0) {
        const q = items[0]!
        const pay = resolveOdooQuotePayability({ state: q.state, validityDate: q.validityDate })
        pass('Odoo quote payability sample', `SO${q.id} → ${pay.reason} payable=${pay.payable}`)
      }
    } catch (e) {
      fail('Odoo list quotations', e instanceof Error ? e.message : String(e))
    }
  } else {
    fail('Odoo abilitato', 'ODOO_ENABLED=false o credenziali mancanti — riavvia server con ODOO_ENABLED=true')
  }

  // —— Shipping pickup label (sessione + carrello + indirizzo Roma) ——
  await api('/api/v1/cart')
  const catalog = await api('/api/v1/catalog/products?locale=IT&pageSize=5')
  const product = (catalog.json as { data?: { items?: { slug?: string }[] } })?.data?.items?.[0]
  if (product?.slug) {
    await api('/api/v1/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productRef: product.slug, quantity: 1 }),
    })
  }
  const shipping = await api('/api/v1/shipping/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      shippingAddress: {
        firstName: 'Test',
        lastName: 'E2E',
        line1: 'Via Test',
        streetNumber: '1',
        isSnc: false,
        city: 'Roma',
        postalCode: '00178',
        country: 'IT',
      },
    }),
  })
  const shipQuotes = (shipping.json as { data?: { quotes?: { label?: string; serviceCode?: string }[] } })?.data?.quotes ?? []
  const pickupMethod = shipQuotes.find(
    (q) => q.serviceCode === 'pickup_roma' || q.label?.toLowerCase().includes('ritiro'),
  )
  pickupMethod?.label?.includes('Pignatelli')
    ? pass('shipping pickup label', pickupMethod.label)
    : shipping.status !== 200
      ? fail('shipping pickup', `HTTP ${shipping.status}`)
      : fail('shipping pickup', JSON.stringify(shipQuotes.map((q) => q.label)))

  const failed = results.filter((r) => !r.ok)
  console.log(`\n=== ${results.length - failed.length}/${results.length} passati ===`)
  if (failed.length > 0) {
    console.log('\nFalliti:')
    for (const f of failed) console.log(` - ${f.name}: ${f.note ?? ''}`)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
