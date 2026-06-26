#!/usr/bin/env node
/**
 * Verifica Sprint 1 go-live: SSR pricing, restock BO, PAID_SYNC alert API.
 * Uso: API_BASE=http://localhost:4000 node server/scripts/sprint1-go-live-test.mjs
 */
const base = (process.env.API_BASE ?? 'http://localhost:4000').replace(/\/$/, '')
const shopEmail = process.env.API_TEST_EMAIL ?? 'demo@example.com'
const shopPassword = process.env.API_TEST_PASSWORD ?? 'password123'
const adminEmail = process.env.ADMIN_SEED_EMAIL ?? 'admin@ideadiluce.local'
const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? 'admin123456'

const shopJar = new Map()
const adminJar = new Map()

function parseSetCookie(headers, jar) {
  for (const c of headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const [k, v] = pair.split('=')
    if (k && v) jar.set(k.trim(), v.trim())
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function req(method, path, body, jar = shopJar) {
  const headers = { Accept: 'application/json' }
  const ch = cookieHeader(jar)
  if (ch) headers.Cookie = ch
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  parseSetCookie(res.headers, jar)
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text.slice(0, 400) }
  }
  return { status: res.status, json, headers: res.headers, text }
}

const results = []

async function check(name, fn) {
  try {
    const detail = await fn()
    const ok = detail === true || detail?.ok === true
    results.push({ name, ok, note: detail?.note })
    console.log(ok ? 'OK' : 'FAIL', name, detail?.note ?? '')
    if (!ok && detail?.note) console.error(' ', detail.note)
  } catch (e) {
    results.push({ name, ok: false, note: e.message })
    console.log('FAIL', name, e.message)
  }
}

function unwrap(data) {
  return data?.data ?? data
}

async function shopLogin() {
  const r = await req('POST', '/api/v1/auth/login', { email: shopEmail, password: shopPassword })
  return r.status === 200 && unwrap(r.json)?.user
}

async function adminLogin() {
  const r = await req(
    'POST',
    '/api/v1/admin/auth/login',
    { email: adminEmail, password: adminPassword },
    adminJar,
  )
  return r.status === 200 && unwrap(r.json)?.user
}

async function getFirstProductId() {
  const list = await req('GET', '/api/v2/products?lang=it&per_page=5')
  const items = unwrap(list.json)?.items ?? []
  return items[0]?.id ?? null
}

function productPriceFromDetail(json) {
  const p = unwrap(json)?.product ?? unwrap(json)
  if (!p) return null
  const v0 = p.variants?.[0]
  return v0?.lst_price ?? p.price_from ?? null
}

// --- Task 4: SSR pricing (session su /api/v2) ---
await check('Task4 — login shop', async () => {
  const ok = await shopLogin()
  return ok ? true : { ok: false, note: `login fallito per ${shopEmail}` }
})

let productId = null
let priceAnon = null
let priceLogged = null

await check('Task4 — prezzo /api/v2 con sessione vs anonimo', async () => {
  productId = await getFirstProductId()
  if (!productId) return { ok: false, note: 'catalogo vuoto' }

  const anonJar = new Map()
  const anon = await req('GET', `/api/v2/product/${productId}?lang=it`, null, anonJar)
  priceAnon = productPriceFromDetail(anon.json)

  const logged = await req('GET', `/api/v2/product/${productId}?lang=it`)
  priceLogged = productPriceFromDetail(logged.json)

  if (anon.status !== 200 || logged.status !== 200) {
    return { ok: false, note: `anon=${anon.status} logged=${logged.status}` }
  }
  if (priceAnon == null || priceLogged == null) {
    return { ok: false, note: 'prezzo non estratto dalla risposta Arfly' }
  }

  // Sessione caricata: utente demo ha partner Odoo → almeno la richiesta con cookie deve rispondere 200.
  // Se listini differiscono, i prezzi possono divergere; se uguali, verifichiamo coerenza carrello.
  const pricesDiffer = priceAnon !== priceLogged
  return {
    ok: true,
    note: pricesDiffer
      ? `anon=${priceAnon} logged=${priceLogged} (listino sessione applicato)`
      : `prezzo=${priceLogged} (stesso listino anon/logged — verifica carrello sotto)`,
  }
})

await check('Task4 — prezzo carrello allineato a /api/v2 (loggato)', async () => {
  if (!productId || priceLogged == null) return { ok: true, note: '(skip)' }
  const detailRes = await req('GET', `/api/v2/product/${productId}?lang=it`)
  const product = unwrap(detailRes.json)?.product
  const slug = product?.slug
  const variantRef = product?.variants?.[0]?.id != null ? String(product.variants[0].id) : null
  if (!slug || !variantRef) return { ok: true, note: '(skip: slug/variante assenti)' }

  await req('DELETE', '/api/v1/cart')
  const add = await req('POST', '/api/v1/cart/items', {
    productRef: slug,
    variantRef,
    quantity: 1,
  })
  if (add.status !== 200 && add.status !== 201) {
    return { ok: false, note: `add status=${add.status} ${JSON.stringify(add.json?.error)}` }
  }
  const line = unwrap(add.json)?.items?.[0]
  const cartCents =
    line?.clientUnitPriceEstimateCents ??
    line?.clientUnitPriceEstimate ??
    null
  const expectedCents = Math.round(priceLogged * 100)
  const match = cartCents === expectedCents
  return match
    ? { ok: true, note: `${cartCents} cents` }
    : {
        ok: false,
        note: `cart=${cartCents} apiV2=${expectedCents} (diff listino IVA/display possibile)`,
      }
})

// --- Task 1: Restock BO ---
let restockRequestId = null

await check('Task1 — admin login', async () => {
  const ok = await adminLogin()
  return ok ? true : { ok: false, note: `admin login fallito ${adminEmail}` }
})

await check('Task1 — RESTOCK_NOTIFY + visibilità BO', async () => {
  const list = await req('GET', '/api/v2/products?lang=it&per_page=30')
  const items = unwrap(list.json)?.items ?? []
  let targetSlug = null
  for (const item of items) {
    if (!item.slug || !item.id) continue
    const detail = await req('GET', `/api/v2/product/${item.id}?lang=it`)
    const enrichBody = {
      slug: item.slug,
      locale: 'IT',
      name: item.title ?? item.slug,
      priceCents: Math.round((unwrap(detail.json)?.product?.price_from ?? 0) * 100),
      priceDisplayMode: 'ex_vat',
      currency: 'EUR',
      inStock: false,
      variants: (unwrap(detail.json)?.product?.variants ?? []).map((v) => ({
        ref: String(v.id),
        label: v.ced || String(v.id),
        priceCents: Math.round((v.lst_price ?? 0) * 100),
        priceDisplayMode: 'ex_vat',
        inStock: false,
      })),
      seo: { metaTitle: null, metaDescription: null, canonical: null, noindex: false },
      alternates: [],
      documents: [],
    }
    const enrich = await req('POST', '/api/v1/catalog/availability/enrich-detail', enrichBody)
    const enriched = unwrap(enrich.json)
    const av = enriched?.variants?.[0]?.availability ?? enriched?.availability
    if (av?.isRestockNotifyEligible || (av?.qtyAvailable === 0 && av?.isOrderable)) {
      targetSlug = item.slug
      break
    }
  }
  if (!targetSlug) return { ok: true, note: '(skip: nessun prodotto RESTOCK_NOTIFY nel campione)' }

  const email = `sprint1-restock-${Date.now()}@example.com`
  const create = await req('POST', `/api/v1/catalog/products/${encodeURIComponent(targetSlug)}/restock-notify`, {
    email,
    quantity: 1,
    requestType: 'RESTOCK_NOTIFY',
  })
  if (create.status !== 200 && create.status !== 201) {
    return { ok: false, note: `create status=${create.status} ${JSON.stringify(create.json?.error)}` }
  }
  restockRequestId = unwrap(create.json)?.id

  const adminList = await req(
    'GET',
    '/api/v1/admin/customers/restock-requests?requestType=RESTOCK_NOTIFY&pageSize=20',
    null,
    adminJar,
  )
  const rows = unwrap(adminList.json)?.items ?? []
  const found = rows.find((r) => r.email === email || r.id === restockRequestId)
  return adminList.status === 200 && found
    ? { ok: true, note: `id=${found.id} slug=${targetSlug}` }
    : { ok: false, note: `admin list status=${adminList.status} found=${!!found}` }
})

await check('Task1 — PATCH adminStatus + adminNotes', async () => {
  if (!restockRequestId) {
    const adminList = await req(
      'GET',
      '/api/v1/admin/customers/restock-requests?pageSize=1',
      null,
      adminJar,
    )
    restockRequestId = unwrap(adminList.json)?.items?.[0]?.id
  }
  if (!restockRequestId) return { ok: true, note: '(skip: nessuna richiesta restock)' }

  const patch = await req(
    'PATCH',
    `/api/v1/admin/customers/restock-requests/${restockRequestId}`,
    { adminStatus: 'IN_PROGRESS', adminNotes: 'sprint1 test' },
    adminJar,
  )
  const row = unwrap(patch.json)
  const ok =
    patch.status === 200 &&
    row?.adminStatus === 'IN_PROGRESS' &&
    row?.adminNotes === 'sprint1 test'
  return ok
    ? { ok: true, note: restockRequestId }
    : { ok: false, note: `status=${patch.status} body=${JSON.stringify(row)}` }
})

await check('Task1 — filtro adminStatus', async () => {
  const r = await req(
    'GET',
    '/api/v1/admin/customers/restock-requests?adminStatus=IN_PROGRESS&pageSize=5',
    null,
    adminJar,
  )
  const items = unwrap(r.json)?.items ?? []
  const allMatch = items.every((i) => i.adminStatus === 'IN_PROGRESS')
  return r.status === 200 && (items.length === 0 || allMatch)
    ? { ok: true, note: `${items.length} righe` }
    : { ok: false, note: `status=${r.status}` }
})

// --- Task 2: PAID_SYNC alert API ---
await check('Task2 — GET paid-sync-pending (admin)', async () => {
  const r = await req('GET', '/api/v1/admin/orders/paid-sync-pending', null, adminJar)
  const data = unwrap(r.json)
  const shapeOk =
    r.status === 200 &&
    typeof data?.count === 'number' &&
    Array.isArray(data?.items)
  return shapeOk
    ? { ok: true, note: `count=${data.count}` }
    : { ok: false, note: `status=${r.status}` }
})

// --- Task 5: availability flags in enrich ---
await check('Task5 — isOrderable vs isUnrecoverable in enrich', async () => {
  const list = await req('GET', '/api/v2/products?lang=it&per_page=15')
  const items = unwrap(list.json)?.items ?? []
  let sawOrderable = false
  for (const item of items.slice(0, 10)) {
    if (!item.slug || !item.id) continue
    const detail = await req('GET', `/api/v2/product/${item.id}?lang=it`)
    const enrichBody = {
      slug: item.slug,
      locale: 'IT',
      name: item.title ?? item.slug,
      priceCents: 1000,
      priceDisplayMode: 'ex_vat',
      currency: 'EUR',
      inStock: true,
      variants: (unwrap(detail.json)?.product?.variants ?? [{ id: 1 }]).map((v) => ({
        ref: String(v.id),
        label: String(v.id),
        priceCents: 1000,
        priceDisplayMode: 'ex_vat',
        inStock: true,
      })),
      seo: { metaTitle: null, metaDescription: null, canonical: null, noindex: false },
      alternates: [],
      documents: [],
    }
    const enrich = await req('POST', '/api/v1/catalog/availability/enrich-detail', enrichBody)
    const enriched = unwrap(enrich.json)
    const av = enriched?.variants?.[0]?.availability ?? enriched?.availability
    if (!av) continue
    if (av.isUnrecoverable && av.isOrderable) {
      return { ok: false, note: 'isUnrecoverable && isOrderable su stesso prodotto' }
    }
    if (av.isOrderable) sawOrderable = true
  }
  return { ok: true, note: sawOrderable ? 'flags coerenti' : '(warn: nessun orderable nel campione)' }
})

const passed = results.filter((r) => r.ok).length
console.log(`\n${passed}/${results.length} passed`)
if (passed < results.length) {
  console.error('\nFalliti:', results.filter((r) => !r.ok).map((r) => r.name).join(', '))
  process.exit(1)
}
