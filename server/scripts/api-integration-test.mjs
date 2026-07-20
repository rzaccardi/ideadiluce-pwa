#!/usr/bin/env node
/**
 * Integration test API storefront (session cookie, catalogo OdooCatalog, carrello, checkout).
 * Uso: API_BASE=http://localhost:4000 node server/scripts/api-integration-test.mjs
 */
const base = (process.env.API_BASE ?? 'http://localhost:4000').replace(/\/$/, '')
const demoEmail = process.env.API_TEST_EMAIL ?? 'demo@example.com'
const demoPassword = process.env.API_TEST_PASSWORD ?? 'password123'

const jar = new Map()

function parseSetCookie(headers) {
  for (const c of headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const [k, v] = pair.split('=')
    if (k && v) jar.set(k.trim(), v.trim())
  }
}

function cookieHeader() {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function req(method, path, body) {
  const headers = { Accept: 'application/json' }
  if (cookieHeader()) headers.Cookie = cookieHeader()
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  parseSetCookie(res.headers)
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text.slice(0, 300) }
  }
  return { status: res.status, json, headers: res.headers }
}

const demoProductRef = process.env.API_TEST_PRODUCT_REF

const shippingAddress = {
  firstName: 'Mario',
  lastName: 'Rossi',
  line1: 'Via Roma',
  streetNumber: '1',
  isSnc: false,
  city: 'Milano',
  postalCode: '20100',
  country: 'IT',
}

const results = []
let productSlug
let cartItemId
let wishlistItemId
let orderId

async function check(name, fn) {
  try {
    const detail = await fn()
    const ok = detail === true || detail?.ok === true
    results.push({ name, ok })
    console.log(ok ? 'OK' : 'FAIL', name, detail?.note ?? '')
    if (!ok && detail?.note) console.error(' ', detail.note)
  } catch (e) {
    results.push({ name, ok: false })
    console.log('FAIL', name, e.message)
  }
}

await check('health', async () => (await req('GET', '/health')).status === 200)

await check('catalog /api/v2/products', async () => {
  const r = await req('GET', '/api/v2/products?lang=it&per_page=2')
  productSlug = r.json?.data?.items?.[0]?.slug
  return r.status === 200 && productSlug ? true : { ok: false, note: `status ${r.status}` }
})

await check('site page home IT', async () => {
  const r = await req('GET', '/api/v1/site/pages/home?locale=IT')
  const content = r.json?.data?.content
  return r.status === 200 && content?.hero?.design?.title
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('site page shell IT', async () => {
  const r = await req('GET', '/api/v1/site/pages/shell?locale=IT')
  const content = r.json?.data?.content
  return r.status === 200 && Array.isArray(content?.nav?.items)
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('site page attacco IT', async () => {
  const r = await req('GET', '/api/v1/site/pages/attacco?locale=IT')
  const content = r.json?.data?.content
  return r.status === 200 && Array.isArray(content?.items) && content.items.length >= 4
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('site page chi-siamo IT', async () => {
  const r = await req('GET', '/api/v1/site/pages/chi-siamo?locale=IT')
  const content = r.json?.data?.content
  return r.status === 200 && Array.isArray(content?.blocks) && content.title
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('site page prodotto-non-trovato IT', async () => {
  const r = await req('GET', '/api/v1/site/pages/prodotto-non-trovato?locale=IT')
  const content = r.json?.data?.content
  const hasForm = content?.blocks?.some((b) => b.kind === 'lead-form')
  return r.status === 200 && hasForm ? true : { ok: false, note: `status ${r.status}` }
})

await check('site page guide article IT', async () => {
  const r = await req('GET', '/api/v1/site/pages/guide-luce-calda-naturale-fredda?locale=IT')
  const content = r.json?.data?.content
  return r.status === 200 && Array.isArray(content?.blocks) && content.title
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('site inquiry contact', async () => {
  const r = await req('POST', '/api/v1/site/inquiries', {
    kind: 'contact',
    name: 'Test API',
    email: 'smoke-test@example.com',
    message: 'Messaggio di test integrazione',
    locale: 'IT',
  })
  return r.status === 200 || r.status === 201
    ? true
    : { ok: false, note: `status ${r.status} ${JSON.stringify(r.json?.error)}` }
})

await check('catalog categories', async () => {
  const r = await req('GET', '/api/v1/catalog/categories')
  return r.status === 200 && Array.isArray(r.json?.data?.items)
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('catalog products BFF', async () => {
  const r = await req('GET', '/api/v1/catalog/products?locale=IT&pageSize=20')
  const data = r.json?.data
  const inStock = data?.items?.find((p) => p.inStock !== false && p.slug)
  if (demoProductRef) productSlug = demoProductRef
  else if (inStock?.slug) productSlug = inStock.slug
  return r.status === 200 && Array.isArray(data?.items)
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('catalog home product sliders', async () => {
  const r = await req('GET', '/api/v1/catalog/home/product-sliders?locale=IT')
  const sliders = r.json?.data
  const cacheControl = r.headers?.get('cache-control')
  const hasProducts =
    Array.isArray(sliders) &&
    sliders.length > 0 &&
    sliders.every(
      (s) =>
        typeof s?.key === 'string' &&
        Array.isArray(s?.products) &&
        s.products.length > 0 &&
        typeof s.products[0]?.slug === 'string' &&
        typeof s.products[0]?.name === 'string',
    )
  const hasCache = typeof cacheControl === 'string' && cacheControl.includes('max-age=172800')
  return r.status === 200 && hasProducts && hasCache
    ? true
    : {
        ok: false,
        note: `status ${r.status} sliders=${Array.isArray(sliders) ? sliders.length : 'n/a'} cache=${cacheControl ?? 'missing'}`,
      }
})

await check('cart session', async () => (await req('GET', '/api/v1/cart')).status === 200)

await check('auth login', async () => {
  const r = await req('POST', '/api/v1/auth/login', { email: demoEmail, password: demoPassword })
  return r.status === 200 ? true : { ok: false, note: JSON.stringify(r.json?.error ?? r.json) }
})

await check('auth me', async () => (await req('GET', '/api/v1/auth/me')).status === 200)

await check('cart clear', async () => (await req('DELETE', '/api/v1/cart')).status === 200)

async function addCartItemWithFallback() {
  const refs = new Set(
    [productSlug, demoProductRef, 'sospensione-vetro', 'applique-led'].filter(Boolean),
  )
  const odooCatalog = await req('GET', '/api/v2/products?lang=it&per_page=20')
  const listItems = odooCatalog.json?.data?.items ?? []

  // Priorità: prodotti con is_orderable esplicito o qty_available > 0
  const prioritized = [...listItems].sort((a, b) => {
    const score = (item) => {
      if (item?.is_orderable === true) return 3
      if (item?.qty_available > 0) return 2
      if (item?.is_orderable !== false) return 1
      return 0
    }
    return score(b) - score(a)
  })
  for (const item of prioritized) {
    if (item?.slug) refs.add(item.slug)
  }

  for (const ref of refs) {
    const listHit = listItems.find((i) => i.slug === ref)
    let variantRef
    if (listHit?.id) {
      const detail = await req('GET', `/api/v2/product/${listHit.id}?lang=it`)
      const variants = detail.json?.data?.product?.variants ?? []
      if (variants[0]?.id != null) variantRef = String(variants[0].id)
    }
    const body = variantRef
      ? { productRef: ref, variantRef, quantity: 1 }
      : { productRef: ref, quantity: 1 }
    const r = await req('POST', '/api/v1/cart/items', body)
    if ((r.status === 200 || r.status === 201) && r.json?.data?.items?.[0]?.id) {
      cartItemId = r.json.data.items[0].id
      productSlug = ref
      return true
    }
  }
  return false
}

let cartReady = false

await check('cart add item', async () => {
  cartReady = await addCartItemWithFallback()
  return cartReady
    ? true
    : {
        ok: false,
        note: process.env.CART_SKIP_STOCK_CHECK === 'true'
          ? 'add fallito anche con CART_SKIP_STOCK_CHECK — verifica catalogo/API'
          : 'nessun prodotto acquistabile (stock Odoo/OdooCatalog) — imposta API_TEST_PRODUCT_REF o CART_SKIP_STOCK_CHECK=true sul server',
      }
})

await check('cart patch item', async () => {
  if (!cartReady || !cartItemId) return { ok: true, note: '(skip: carrello vuoto)' }
  const r = await req('PATCH', `/api/v1/cart/items/${cartItemId}`, { quantity: 2 })
  return r.status === 200 && r.json?.data?.items?.[0]?.quantity === 2
})

await check('cart stock', async () => (await req('GET', '/api/v1/cart/stock')).status === 200)

await check('cart recommendations', async () => {
  const r = await req('GET', '/api/v1/cart/recommendations')
  return r.status === 200 && Array.isArray(r.json?.data)
})

await check('wishlist list', async () => {
  const r = await req('GET', '/api/v1/wishlist')
  return r.status === 200 && Array.isArray(r.json?.data)
})

await check('wishlist add', async () => {
  const r = await req('POST', '/api/v1/wishlist/items', { productRef: productSlug })
  wishlistItemId = r.json?.data?.id
  return (r.status === 200 || r.status === 201) && wishlistItemId
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('wishlist remove', async () =>
  (await req('DELETE', `/api/v1/wishlist/items/${wishlistItemId}`)).status === 200,
)

await check('shipping quotes', async () => {
  if (!cartReady) return { ok: true, note: '(skip: carrello vuoto)' }
  const r = await req('POST', '/api/v1/shipping/quotes', { shippingAddress })
  return r.status === 200 && r.json?.data?.quotes?.length
    ? true
    : { ok: false, note: `status ${r.status}` }
})

await check('shipping select', async () => {
  if (!cartReady) return { ok: true, note: '(skip: carrello vuoto)' }
  const q = await req('POST', '/api/v1/shipping/quotes', { shippingAddress })
  const methodRef = q.json?.data?.quotes?.[0]?.methodRef
  const r = await req('POST', '/api/v1/shipping/select', { shippingAddress, methodRef })
  return r.status === 200 ? true : { ok: false, note: `status ${r.status}` }
})

await check('checkout start', async () => {
  if (!cartReady) return { ok: true, note: '(skip: carrello vuoto)' }
  const r = await req('POST', '/api/v1/checkout/start', {
    email: demoEmail,
    billingAddress: shippingAddress,
    shippingAddress,
  })
  orderId = r.json?.data?.orderId
  return (r.status === 200 || r.status === 201) && orderId
    ? true
    : { ok: false, note: `status ${r.status} ${JSON.stringify(r.json?.error)}` }
})

await check('order status', async () => {
  if (!orderId) return { ok: true, note: '(skip: checkout non eseguito)' }
  const r = await req('GET', `/api/v1/orders/${orderId}/status`)
  const ok = r.status === 200 && Boolean(r.json?.data?.orderId)
  return ok ? true : { ok: false, note: `status ${r.status} orderId=${orderId}` }
})

await check('stripe config', async () => {
  const r = await req('GET', '/api/v1/payments/stripe/config')
  const enabled = r.json?.data?.enabled
  const pk = r.json?.data?.publishableKey
  if (!enabled) return { ok: true, note: '(STRIPE_ENABLED=false, skip)' }
  return r.status === 200 && typeof enabled === 'boolean'
    ? true
    : { ok: false, note: `status ${r.status}` }
})

let stripePaymentId
await check('payments create-session stripe', async () => {
  if (!orderId) return { ok: true, note: '(skip: checkout non eseguito)' }
  const cfg = await req('GET', '/api/v1/payments/stripe/config')
  if (!cfg.json?.data?.enabled) return { ok: true, note: '(Stripe disabilitato, skip)' }
  const r = await req('POST', '/api/v1/payments/create-session', {
    orderId,
    paymentMethod: 'stripe',
  })
  stripePaymentId = r.json?.data?.paymentId
  const hasSecret = Boolean(r.json?.data?.clientSecret)
  return r.status === 201 && hasSecret
    ? true
    : { ok: false, note: `status ${r.status} ${JSON.stringify(r.json?.error)}` }
})

await check('payments stripe return by orderId', async () => {
  if (!orderId) return { ok: true, note: '(skip: checkout non eseguito)' }
  const cfg = await req('GET', '/api/v1/payments/stripe/config')
  if (!cfg.json?.data?.enabled) return { ok: true, note: '(Stripe disabilitato, skip)' }
  const r = await req('GET', `/api/v1/payments/stripe/return?order_id=${encodeURIComponent(orderId)}`)
  return r.status === 200 && r.json?.data?.orderId === orderId
    ? true
    : { ok: false, note: `status ${r.status} ${JSON.stringify(r.json?.error)}` }
})

await check('payments create-session bank_transfer', async () => {
  if (!orderId) return { ok: true, note: '(skip: checkout non eseguito)' }
  const r = await req('POST', '/api/v1/payments/create-session', {
    orderId,
    paymentMethod: 'bank_transfer',
  })
  const instructions = r.json?.data?.instructions
  const hasIban = Boolean(instructions?.iban)
  return r.status === 201 && hasIban
    ? true
    : { ok: false, note: `status ${r.status} ${JSON.stringify(r.json?.error)}` }
})

await check('payments confirm bank_transfer pending', async () => {
  if (!orderId) return { ok: true, note: '(skip: checkout non eseguito)' }
  const session = await req('POST', '/api/v1/payments/create-session', {
    orderId,
    paymentMethod: 'bank_transfer',
  })
  const paymentId = session.json?.data?.paymentId
  if (!paymentId) return { ok: false, note: 'paymentId missing' }
  const r = await req('POST', '/api/v1/payments/confirm', {
    paymentId,
    mockStatus: 'pending',
  })
  const pending = r.json?.data?.paymentStatus === 'pending'
  return r.status === 200 && pending
    ? true
    : { ok: false, note: `status ${r.status} ${JSON.stringify(r.json?.data)}` }
})

await check('orders list', async () => {
  const r = await req('GET', '/api/v1/orders')
  return r.status === 200 && Array.isArray(r.json?.data)
})

await check('seo sitemap', async () => {
  const res = await fetch(`${base}/sitemap.xml`)
  const text = await res.text()
  const hasUrls =
    text.includes('/prodotto/') || text.includes('/categoria/') || text.includes('/brand/')
  return res.status === 200 && text.includes('<urlset') && hasUrls
})

await check('forgot password', async () =>
  (await req('POST', '/api/v1/auth/forgot-password', { email: 'smoke-test@example.com' })).status === 200,
)

await check('odoo ping', async () => {
  const r = await req('GET', '/api/v1/integrations/odoo/ping')
  return r.status === 200 ? true : { ok: true, note: `(status ${r.status}, opzionale)` }
})

await check('auth logout', async () => (await req('POST', '/api/v1/auth/logout')).status === 200)

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
