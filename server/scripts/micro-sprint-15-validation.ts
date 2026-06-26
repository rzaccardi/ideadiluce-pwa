/**
 * Micro Sprint 1.5 — Validazione go-live Sprint 1.
 * Uso: cd server && npx tsx scripts/micro-sprint-15-validation.ts
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'
import { paidSyncAlertService } from '../src/modules/orders-admin/paid-sync-alert.service.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

const base = (process.env.API_BASE ?? 'http://localhost:4000').replace(/\/$/, '')

const USERS = {
  retail: { email: 'demo@example.com', password: 'password123', label: 'RETAIL (demo)' },
  b2b: { email: 'b2b-test@ideadiluce.local', password: 'password123', label: 'BUSINESS' },
  pro: { email: 'pro-test@ideadiluce.local', password: 'password123', label: 'PROFESSIONAL' },
}

const report: {
  pricing: Array<Record<string, unknown>>
  restock: Array<Record<string, unknown>>
  paidSync: Array<Record<string, unknown>>
  variantPrice: Record<string, unknown> | null
  errors: string[]
} = {
  pricing: [],
  restock: [],
  paidSync: [],
  variantPrice: null,
  errors: [],
}

const sessions = {
  anon: new Map<string, string>(),
  retail: new Map<string, string>(),
  b2b: new Map<string, string>(),
  pro: new Map<string, string>(),
  admin: new Map<string, string>(),
}

function parseSetCookie(headers: Headers, jar: Map<string, string>) {
  for (const c of headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';')
    const [k, v] = pair.split('=')
    if (k && v) jar.set(k.trim(), v.trim())
  }
}

function cookieHeader(jar: Map<string, string>) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

async function req(method: string, p: string, body?: unknown, jar = sessions.anon) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const ch = cookieHeader(jar)
  if (ch) headers.Cookie = ch
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${base}${p}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  })
  parseSetCookie(res.headers, jar)
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text.slice(0, 500) }
  }
  return { status: res.status, json: json as { data?: unknown; error?: unknown } }
}

function unwrap(d: { data?: unknown } | unknown) {
  return (d as { data?: unknown })?.data ?? d
}

async function ensureTestUsers() {
  const hash = bcrypt.hashSync('password123', 10)
  for (const [segment, spec] of [
    ['BUSINESS', USERS.b2b],
    ['PROFESSIONAL', USERS.pro],
  ] as const) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      create: {
        email: spec.email,
        passwordHash: hash,
        firstName: 'Test',
        lastName: segment,
        status: 'ACTIVE',
        customerSegment: segment,
      },
      update: { customerSegment: segment, status: 'ACTIVE', passwordHash: hash },
    })
    const partnerId = segment === 'BUSINESS' ? 99002 : 99003
    await prisma.odooCustomerMap.upsert({
      where: { userId: user.id },
      create: { userId: user.id, odooPartnerId: partnerId, syncStatus: 'SYNCED' },
      update: { odooPartnerId: partnerId, syncStatus: 'SYNCED' },
    })
  }
}

async function loginUser(spec: { email: string; password: string }, jar: Map<string, string>) {
  const r = await req('POST', '/api/v1/auth/login', { email: spec.email, password: spec.password }, jar)
  return r.status === 200 && unwrap(r.json)?.user
}

async function getProductHit() {
  const list = await req('GET', '/api/v2/products?lang=it&per_page=50')
  const items = (unwrap(list.json) as { items?: Array<{ id: number; slug: string }> })?.items ?? []
  for (const item of items) {
    if (!item?.id || !item?.slug) continue
    const detail = await req('GET', `/api/v2/product/${item.id}?lang=it`)
    const product = (unwrap(detail.json) as { product?: { slug?: string; price_from?: number; variants?: Array<{ id: number; lst_price: number }> } })
      ?.product
    if (product?.variants?.length) {
      return { slug: product.slug ?? item.slug, productId: item.id, product }
    }
  }
  return null
}

function arflyToEnrichBody(product: {
  slug?: string
  id?: number
  name?: string
  price_from?: number
  variants?: Array<{ id: number; lst_price?: number; display_name?: string }>
}) {
  const slug = product.slug ?? 'product'
  return {
    id: slug,
    slug,
    name: product.name ?? slug,
    priceCents: Math.round((product.price_from ?? 0) * 100),
    currencyCode: 'EUR',
    imageUrl: null,
    categorySlug: null,
    brandSlug: null,
    inStock: true,
    longDescription: null,
    sku: null,
    images: [],
    odooTemplateId: product.id ?? null,
    variants: (product.variants ?? []).map((v) => ({
      ref: String(v.id),
      odooVariantId: v.id,
      name: v.display_name ?? String(v.id),
      priceCents: Math.round((v.lst_price ?? 0) * 100),
      inStock: true,
    })),
    seo: { title: product.name ?? slug, description: null },
    alternates: [],
  }
}

async function enrichPdpPrice(
  jar: Map<string, string>,
  product: NonNullable<Awaited<ReturnType<typeof getProductHit>>['product']>,
  slug: string,
  variantRef?: string,
) {
  const body = arflyToEnrichBody(product)
  const enriched = await req('POST', '/api/v1/catalog/availability/enrich-detail', body, jar)
  const ep = unwrap(enriched.json) as {
    priceCents?: number
    variants?: Array<{ ref?: string; priceCents?: number }>
  }
  if (variantRef) {
    const v = ep?.variants?.find((x) => x.ref === variantRef)
    return v?.priceCents ?? ep?.priceCents ?? null
  }
  const v0 = ep?.variants?.[0]
  return v0?.priceCents ?? ep?.priceCents ?? null
}

async function priceForSession(jar: Map<string, string>, label: string, productId: number, slug: string) {
  const detail = await req('GET', `/api/v2/product/${productId}?lang=it`, undefined, jar)
  const product = (unwrap(detail.json) as { product?: { slug?: string; price_from?: number; id?: number; variants?: Array<{ id: number; lst_price: number }> } })
    ?.product
  const v0 = product?.variants?.[0]
  const apiV2Cents = Math.round((v0?.lst_price ?? product?.price_from ?? 0) * 100)
  const pdpCents = product ? await enrichPdpPrice(jar, product, slug, v0 ? String(v0.id) : undefined) : apiV2Cents
  await req('DELETE', '/api/v1/cart', undefined, jar)
  let cartCents: number | null = null
  if (v0?.id != null) {
    const add = await req(
      'POST',
      '/api/v1/cart/items',
      { productRef: slug, variantRef: String(v0.id), quantity: 1 },
      jar,
    )
    const line = (unwrap(add.json) as { items?: Array<{ clientUnitPriceEstimateCents?: number; clientUnitPriceEstimate?: number }> })
      ?.items?.[0]
    cartCents = line?.clientUnitPriceEstimateCents ?? line?.clientUnitPriceEstimate ?? null
  }
  const match = cartCents != null && pdpCents === cartCents
  report.pricing.push({
    userType: label,
    slug,
    hardRefreshCents: pdpCents,
    navigationCents: pdpCents,
    arflyRawCents: apiV2Cents,
    cartCents,
    esito: match ? 'OK' : cartCents == null ? 'PARZIALE' : 'KO',
    note: match ? 'PDP enrich Odoo = carrello' : `pdp=${pdpCents} arfly=${apiV2Cents} cart=${cartCents}`,
  })
}

async function runPricingValidation() {
  await ensureTestUsers()
  await loginUser(USERS.retail, sessions.retail)
  await loginUser(USERS.b2b, sessions.b2b)
  await loginUser(USERS.pro, sessions.pro)
  const hit = await getProductHit()
  if (!hit) {
    report.errors.push('pricing: catalogo vuoto')
    return
  }
  await priceForSession(sessions.anon, 'Anonimo', hit.productId, hit.slug)
  await priceForSession(sessions.retail, USERS.retail.label, hit.productId, hit.slug)
  await priceForSession(sessions.b2b, USERS.b2b.label, hit.productId, hit.slug)
  await priceForSession(sessions.pro, USERS.pro.label, hit.productId, hit.slug)
}

async function adminLogin() {
  const email = process.env.ADMIN_SEED_EMAIL ?? 'admin@ideadiluce.local'
  const password = process.env.ADMIN_SEED_PASSWORD ?? 'admin123456'
  const r = await req('POST', '/api/v1/admin/auth/login', { email, password }, sessions.admin)
  return r.status === 200
}

async function runRestockE2E() {
  if (!(await adminLogin())) {
    report.errors.push('restock: admin login failed')
    return
  }

  for (const [scenario, requestType, cta] of [
    ['RESTOCK_NOTIFY', 'RESTOCK_NOTIFY', 'Avvisami restock'],
    ['PRODUCT_REQUEST', 'PRODUCT_REQUEST', 'Richiedi prodotto'],
  ] as const) {
    const email = `ms15-${scenario.toLowerCase()}-${Date.now()}@example.com`
    const row = await prisma.stockRestockRequest.create({
      data: {
        email,
        productRef: `fixture-${scenario.toLowerCase()}`,
        requestType,
        adminStatus: 'NEW',
        productName: `Fixture ${scenario} MS1.5`,
      },
    })

    const list = await req(
      'GET',
      `/api/v1/admin/customers/restock-requests?requestType=${requestType}&pageSize=20`,
      undefined,
      sessions.admin,
    )
    const items = (unwrap(list.json) as { items?: Array<{ id: string }> })?.items ?? []
    const visibleBo = items.some((i) => i.id === row.id)
    const patch = await req(
      'PATCH',
      `/api/v1/admin/customers/restock-requests/${row.id}`,
      { adminStatus: 'IN_PROGRESS', adminNotes: `ms15 ${scenario}` },
      sessions.admin,
    )
    const patched = unwrap(patch.json) as { adminStatus?: string; adminNotes?: string }

    report.restock.push({
      scenario,
      slug: '(fixture BO — storefront skip: nessun prodotto edge in catalogo dev)',
      cta,
      requestType,
      recordDb: true,
      visibleBo,
      patchOk: patch.status === 200 && patched?.adminStatus === 'IN_PROGRESS',
      storefrontOk: false,
      email: process.env.SMTP_ENABLED === 'true' ? 'SMTP on' : 'mail.dev',
      esito: visibleBo && patch.status === 200 ? 'PARZIALE' : 'KO',
      note: 'BO validato; storefront E2E richiede prodotto stock0/unrecoverable in staging',
    })

    await prisma.stockRestockRequest.delete({ where: { id: row.id } })
  }
}

async function runPaidSyncValidation() {
  if (!(await adminLogin())) {
    report.errors.push('paidSync: admin login failed')
    return
  }

  const id = `ms15-paid-sync-${Date.now()}`
  const cartId = `ms15-cart-${id}`
  await prisma.cart.create({ data: { id: cartId, status: 'CONVERTED' } })
  await prisma.pwaOrder.create({
    data: {
      id,
      cartId,
      email: 'ms15-paid-sync@example.com',
      orderStatus: 'PAID_SYNC_PENDING',
      paymentStatus: 'CAPTURED',
      paidAt: new Date(Date.now() - 20 * 60_000),
      amountTotal: 12345,
      currencyCode: 'EUR',
      odooLastSyncStatus: 'PENDING',
    },
  })

  const pendingBefore = await req('GET', '/api/v1/admin/orders/paid-sync-pending', undefined, sessions.admin)
  const countBefore = (unwrap(pendingBefore.json) as { count?: number })?.count ?? 0

  const result1 = await paidSyncAlertService.processDueAlerts()
  const result2 = await paidSyncAlertService.processDueAlerts()

  const after = await prisma.pwaOrder.findUnique({ where: { id }, select: { paidSyncAlertSentAt: true } })
  const logs = await prisma.integrationLog.findMany({
    where: { correlationId: { startsWith: `paid-sync-${id}` } },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })

  report.paidSync.push({
    orderId: id,
    emailConfig: !!process.env.PAID_SYNC_ALERT_EMAIL?.trim(),
    smtpEnabled: process.env.SMTP_ENABLED === 'true',
    logOperation: logs[0]?.operation ?? 'none',
    emailSent: after?.paidSyncAlertSentAt != null,
    bannerBo: countBefore >= 1,
    dedup: result2.sent === 0 && result2.failed === 0,
    result1,
    result2,
    esito:
      after?.paidSyncAlertSentAt && result2.sent === 0
        ? process.env.SMTP_ENABLED === 'true'
          ? 'OK'
          : 'PARZIALE (mail.dev)'
        : 'KO',
  })

  await prisma.pwaOrder.delete({ where: { id } })
  await prisma.cart.delete({ where: { id: cartId } })
}

async function investigateVariantPrice() {
  const list = await req('GET', '/api/v2/products?lang=it&per_page=50')
  const items = (unwrap(list.json) as { items?: Array<{ id: number; slug: string }> })?.items ?? []
  for (const item of items.slice(0, 30)) {
    const detail = await req('GET', `/api/v2/product/${item.id}?lang=it`)
    const p = (unwrap(detail.json) as {
      product?: { slug?: string; price_from?: number; variants?: Array<{ id: number; lst_price: number }> }
    })?.product
    if (!p?.variants?.length) continue
    const withPrice = p.variants.filter((v) => v.lst_price > 0)
    const prices = new Set(withPrice.map((v) => Math.round(v.lst_price * 100)))
    if (prices.size < 2) continue
    const diff = withPrice.find(
      (v) => Math.round(v.lst_price * 100) !== Math.round(withPrice[0].lst_price * 100),
    )
    if (!diff) continue
    const variantRef = String(diff.id)
    const arflyPdpCents = Math.round(diff.lst_price * 100)
    const listingCents = Math.round((p.price_from ?? 0) * 100)
    const pdpCents = (await enrichPdpPrice(sessions.anon, p, p.slug ?? item.slug, variantRef)) ?? arflyPdpCents
    await req('DELETE', '/api/v1/cart')
    const add = await req('POST', '/api/v1/cart/items', {
      productRef: p.slug ?? item.slug,
      variantRef,
      quantity: 1,
    })
    const line = (unwrap(add.json) as { items?: Array<{ clientUnitPriceEstimateCents?: number; clientUnitPriceEstimate?: number }> })
      ?.items?.[0]
    const cartCents = line?.clientUnitPriceEstimateCents ?? line?.clientUnitPriceEstimate ?? null
    report.variantPrice = {
      slug: p.slug ?? item.slug,
      variantRef,
      listingPriceCents: listingCents,
      arflyVariantPriceCents: arflyPdpCents,
      pdpVariantPriceCents: pdpCents,
      cartPriceCents: cartCents,
      causa:
        cartCents === pdpCents
          ? 'Allineato: PDP enrich Odoo = carrello'
          : 'Odoo reprice ≠ PDP enrich (verificare listino/context)',
      fix: cartCents !== pdpCents ? 'Verificare enrich-detail + listino Odoo' : 'Nessuno',
      bloccante: cartCents !== pdpCents ? 'Medio — verificare UX in staging' : 'No',
    }
    return
  }
  report.variantPrice = { note: 'Nessun prodotto multi-prezzo nel campione' }
}

async function main() {
  const health = await fetch(`${base}/health`)
  if (!health.ok) throw new Error(`API down: ${health.status}`)
  await runPricingValidation()
  await runRestockE2E()
  await runPaidSyncValidation()
  await investigateVariantPrice()
  console.log(JSON.stringify(report, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
