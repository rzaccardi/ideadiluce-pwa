/**
 * Task 2 — Guest quote flow (API integration).
 * Uso: cd server && npx tsx scripts/guest-quote-flow-test.ts
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../src/lib/prisma.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

const base = (process.env.API_BASE ?? 'http://localhost:4000').replace(/\/$/, '')

const jar = new Map<string, string>()
const results: Array<{ name: string; ok: boolean; note?: string }> = []

function parseSetCookie(headers: Headers) {
  for (const c of headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const [k, v] = pair.split('=')
    if (k && v) jar.set(k.trim(), v.trim())
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function req(method: string, p: string, body?: unknown) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const ch = cookieHeader()
  if (ch) headers.Cookie = ch
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${base}${p}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  parseSetCookie(res.headers)
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text.slice(0, 500) }
  }
  return { status: res.status, json: json as { data?: unknown; error?: { code?: string; message?: string } } }
}

function unwrap(d: { data?: unknown } | unknown) {
  return (d as { data?: unknown })?.data ?? d
}

function check(name: string, ok: boolean, note?: string) {
  results.push({ name, ok, note })
  console.log(ok ? '✓' : '✗', name, note ? `— ${note}` : '')
}

async function findOrderableProduct(): Promise<{ slug: string; variantRef: string } | null> {
  const list = await req('GET', '/api/v2/products?lang=it&limit=20')
  const items = (unwrap(list.json) as { items?: Array<{ slug?: string; id?: number }> })?.items ?? []
  for (const item of items) {
    const detail = await req('GET', `/api/v2/product/${item.id}?lang=it`)
    const p = (unwrap(detail.json) as {
      product?: { slug?: string; variants?: Array<{ id: number; availability?: { purchasable?: boolean } }> }
    })?.product
    const variant = p?.variants?.find((v) => v.availability?.purchasable !== false)
    if (p?.slug && variant) return { slug: p.slug, variantRef: String(variant.id) }
  }
  return null
}

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`API down: ${health.status}`)

  jar.clear()
  const product = await findOrderableProduct()
  if (!product) {
    check('Trova prodotto acquistabile', false, 'nessun prodotto nel catalogo')
    process.exit(1)
  }

  const add = await req('POST', '/api/v1/cart/items', {
    productRef: product.slug,
    variantRef: product.variantRef,
    quantity: 1,
  })
  check('Guest add-to-cart', add.status === 200 || add.status === 201, `status=${add.status}`)

  const anonQuote = await req('POST', '/api/v1/quotes/request', { notes: 'should fail' })
  check(
    'Anonimo bloccato su POST /quotes/request',
    anonQuote.status === 401,
    `status=${anonQuote.status} code=${anonQuote.json?.error?.code ?? 'n/a'}`,
  )

  const guestEmail = `guest-quote-${Date.now()}@ideadiluce.local`
  const address = {
    firstName: 'Guest',
    lastName: 'Quote',
    line1: 'Via Test',
    streetNumber: '1',
    isSnc: false,
    city: 'Milano',
    postalCode: '20100',
    country: 'IT',
  }

  const reg = await req('POST', '/api/v1/auth/checkout-register', {
    email: guestEmail,
    password: 'password123',
    firstName: 'Guest',
    lastName: 'Quote',
    phone: '+3900000000',
  })
  check(
    'Checkout-register inline',
    reg.status === 200 || reg.status === 201,
    `status=${reg.status} code=${reg.json?.error?.code ?? 'ok'}`,
  )

  const me = await req('GET', '/api/v1/auth/me')
  const meData = unwrap(me.json) as { user?: { email?: string } } | null
  check('Sessione autenticata post-register', me.status === 200 && meData?.user?.email === guestEmail)

  const cartAfter = await req('GET', '/api/v1/cart')
  const cartItems = (unwrap(cartAfter.json) as { items?: unknown[] })?.items ?? []
  check('Carrello merge post-register', cartItems.length > 0, `items=${cartItems.length}`)

  const quote = await req('POST', '/api/v1/quotes/request', {
    notes: 'Test guest quote flow',
    billingAddress: address,
    shippingAddress: address,
  })
  const quoteData = unwrap(quote.json) as { id?: string; status?: string } | null
  check(
    'Crea richiesta preventivo',
    (quote.status === 200 || quote.status === 201) && Boolean(quoteData?.id),
    `status=${quote.status} id=${quoteData?.id ?? 'n/a'}`,
  )

  if (quoteData?.id) {
    const row = await prisma.quoteRequest.findUnique({ where: { id: quoteData.id } })
    check('Salvato in BO (QuoteRequest)', Boolean(row), row ? `status=${row.status}` : 'not found')
  }

  const list = await req('GET', '/api/v1/quotes')
  const quotes = (unwrap(list.json) as unknown[]) ?? []
  const found = quotes.some((q) => (q as { id?: string }).id === quoteData?.id)
  check('Preventivo in GET /quotes', found, `count=${quotes.length}`)

  const dupReg = await req('POST', '/api/v1/auth/checkout-register', {
    email: guestEmail,
    password: 'password123',
    firstName: 'Dup',
    lastName: 'User',
  })
  check(
    'EMAIL_TAKEN su register duplicato',
    dupReg.status === 409 && dupReg.json?.error?.code === 'EMAIL_TAKEN',
    `status=${dupReg.status}`,
  )

  const emptyQuote = await req('POST', '/api/v1/quotes/request', { notes: 'empty' })
  await req('DELETE', '/api/v1/cart')
  const emptyAfterDelete = await req('POST', '/api/v1/quotes/request', { notes: 'empty' })
  check(
    'Carrello vuoto rifiutato',
    emptyAfterDelete.status === 400 && emptyAfterDelete.json?.error?.code === 'EMPTY_CART',
    `status=${emptyAfterDelete.status} (prev=${emptyQuote.status})`,
  )

  const failed = results.filter((r) => !r.ok)
  console.log('\n---')
  console.log(`${results.length - failed.length}/${results.length} passed`)
  if (failed.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
