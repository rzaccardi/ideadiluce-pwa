/**
 * Smoke listini: stesso prodotto, context retail / rivenditori / installatori.
 *
 * Uso:
 *   cd server && npx tsx scripts/odoo-pricelist-price-smoke.ts
 *   TEMPLATE_ID=123 npx tsx scripts/odoo-pricelist-price-smoke.ts
 *   VARIANT_ID=456 npx tsx scripts/odoo-pricelist-price-smoke.ts
 *   SKIP_API=1 npx tsx scripts/odoo-pricelist-price-smoke.ts
 *
 * Confronta `list_price` XML-RPC (stesso path di odooPricing.service) e, se l'API è su,
 * i centesimi PDP dopo login dei tre segmenti. Non scrive su Postgres né su Odoo.
 */
import { config } from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '../src/config/env.js'
import { isOdooConfigured, odooExecuteKw, type OdooCallContext } from '../src/adapters/odoo/odooClient.js'
import { unitPriceCentsFromOdoo } from '../src/modules/catalog/odooPricing.service.js'
import type { PricingContext } from '../src/modules/pricing/pricelist.service.js'
import { evaluatePricelistSmoke, type PricelistSmokeRow } from '../src/modules/pricing/pricelist-smoke-eval.js'

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
config({ path: path.join(serverRoot, '..', '.env') })

const ctx: OdooCallContext = { correlationId: 'odoo-pricelist-price-smoke' }
const apiBase = (process.env.API_BASE ?? `http://localhost:${env.PORT}`).replace(/\/$/, '')
const skipApi = process.env.SKIP_API === '1'
const b2bPartnerId = Number(process.env.ODOO_TEST_B2B_PARTNER_ID ?? 99002)
const proPartnerId = Number(process.env.ODOO_TEST_PRO_PARTNER_ID ?? 99003)

const USERS = {
  b2b: { email: 'b2b-test@ideadiluce.local', password: 'password123' },
  pro: { email: 'pro-test@ideadiluce.local', password: 'password123' },
}

type TemplateHit = {
  id: number
  name: string
  default_code?: string | false
  list_price?: number
}

async function pickProduct(): Promise<{ templateId: number; variantId: number | null; name: string }> {
  const variantEnv = Number(process.env.VARIANT_ID ?? 0)
  const templateEnv = Number(process.env.TEMPLATE_ID ?? 0)

  if (Number.isInteger(variantEnv) && variantEnv > 0) {
    const rows = await odooExecuteKw<Array<{ id: number; product_tmpl_id: [number, string]; display_name?: string }>>(
      ctx,
      'product.product',
      'read',
      [[variantEnv]],
      { fields: ['id', 'product_tmpl_id', 'display_name'] },
    )
    const row = rows[0]
    if (!row) throw new Error(`VARIANT_ID=${variantEnv} non trovato`)
    const templateId = Array.isArray(row.product_tmpl_id) ? row.product_tmpl_id[0] : templateEnv
    return { templateId, variantId: row.id, name: row.display_name ?? String(row.id) }
  }

  if (Number.isInteger(templateEnv) && templateEnv > 0) {
    const rows = await odooExecuteKw<TemplateHit[]>(
      ctx,
      'product.template',
      'read',
      [[templateEnv]],
      { fields: ['id', 'name', 'default_code', 'list_price'] },
    )
    const row = rows[0]
    if (!row) throw new Error(`TEMPLATE_ID=${templateEnv} non trovato`)
    const variants = await odooExecuteKw<Array<{ id: number }>>(
      ctx,
      'product.product',
      'search_read',
      [[['product_tmpl_id', '=', row.id]]],
      { fields: ['id'], limit: 1 },
    )
    return { templateId: row.id, variantId: variants[0]?.id ?? null, name: row.name }
  }

  const templates = await odooExecuteKw<TemplateHit[]>(
    ctx,
    'product.template',
    'search_read',
    [[['sale_ok', '=', true], ['list_price', '>', 0]]],
    { fields: ['id', 'name', 'default_code', 'list_price'], limit: 1, order: 'id asc' },
  )
  const row = templates[0]
  if (!row) throw new Error('Nessun product.template sale_ok con list_price > 0')
  const variants = await odooExecuteKw<Array<{ id: number }>>(
    ctx,
    'product.product',
    'search_read',
    [[['product_tmpl_id', '=', row.id]]],
    { fields: ['id'], limit: 1 },
  )
  return { templateId: row.id, variantId: variants[0]?.id ?? null, name: row.name }
}

async function partnerPricelist(
  partnerId: number,
): Promise<{ partnerId: number; pricelistId: number | null; pricelistName: string | null } | null> {
  if (!Number.isInteger(partnerId) || partnerId <= 0) return null
  try {
    const rows = await odooExecuteKw<
      Array<{ id: number; name?: string; property_product_pricelist?: [number, string] | false }>
    >(ctx, 'res.partner', 'read', [[partnerId]], { fields: ['id', 'name', 'property_product_pricelist'] })
    const pl = rows[0]?.property_product_pricelist
    return {
      partnerId,
      pricelistId: Array.isArray(pl) ? pl[0] : null,
      pricelistName: Array.isArray(pl) ? pl[1] : null,
    }
  } catch {
    return { partnerId, pricelistId: null, pricelistName: null }
  }
}

async function listPricelists() {
  return odooExecuteKw<Array<{ id: number; name: string }>>(
    ctx,
    'product.pricelist',
    'search_read',
    [[['active', '=', true]]],
    { fields: ['id', 'name'], limit: 80, order: 'id asc' },
  )
}

function matchPricelistId(
  lists: Array<{ id: number; name: string }>,
  patterns: RegExp[],
): number | null {
  for (const pattern of patterns) {
    const hit = lists.find((row) => pattern.test(row.name))
    if (hit) return hit.id
  }
  return null
}

function resolveListId(
  envId: number | undefined,
  partnerId: number | null,
  lists: Array<{ id: number; name: string }>,
  patterns: RegExp[],
): number | null {
  if (envId != null && envId > 0) return envId
  if (partnerId != null && partnerId > 0) return partnerId
  return matchPricelistId(lists, patterns)
}

async function pickProductFromPricelist(pricelistId: number): Promise<{
  templateId: number
  variantId: number | null
  name: string
} | null> {
  const items = await odooExecuteKw<
    Array<{
      product_tmpl_id?: [number, string] | false
      product_id?: [number, string] | false
    }>
  >(
    ctx,
    'product.pricelist.item',
    'search_read',
    [[['pricelist_id', '=', pricelistId], ['applied_on', 'in', ['1_product', '0_product_variant']]]],
    { fields: ['product_tmpl_id', 'product_id'], limit: 20, order: 'id desc' },
  )

  for (const item of items) {
    if (Array.isArray(item.product_id) && item.product_id[0] > 0) {
      const variantId = item.product_id[0]
      const rows = await odooExecuteKw<Array<{ id: number; product_tmpl_id: [number, string]; display_name?: string }>>(
        ctx,
        'product.product',
        'read',
        [[variantId]],
        { fields: ['id', 'product_tmpl_id', 'display_name'] },
      )
      const row = rows[0]
      if (!row) continue
      return {
        templateId: Array.isArray(row.product_tmpl_id) ? row.product_tmpl_id[0] : variantId,
        variantId,
        name: row.display_name ?? String(variantId),
      }
    }
    if (Array.isArray(item.product_tmpl_id) && item.product_tmpl_id[0] > 0) {
      const templateId = item.product_tmpl_id[0]
      const variants = await odooExecuteKw<Array<{ id: number }>>(
        ctx,
        'product.product',
        'search_read',
        [[['product_tmpl_id', '=', templateId]]],
        { fields: ['id'], limit: 1 },
      )
      return {
        templateId,
        variantId: variants[0]?.id ?? null,
        name: item.product_tmpl_id[1],
      }
    }
  }
  return null
}

async function xmlrpcPrice(product: { templateId: number; variantId: number | null }, pricing: PricingContext) {
  return unitPriceCentsFromOdoo(
    ctx,
    String(product.templateId),
    product.variantId != null ? String(product.variantId) : null,
    pricing,
  )
}

async function probeLstPrice(
  variantId: number | null,
  pricelistId: number | null,
): Promise<{ list_price: number | null; lst_price: number | null }> {
  if (variantId == null) return { list_price: null, lst_price: null }
  const context: Record<string, unknown> = { lang: env.ODOO_CATALOG_LANG }
  if (pricelistId) context.pricelist = pricelistId
  const rows = await odooExecuteKw<Array<{ list_price?: number; lst_price?: number }>>(
    ctx,
    'product.product',
    'read',
    [[variantId]],
    { fields: ['list_price', 'lst_price'], context },
  )
  const row = rows[0]
  return {
    list_price: row?.list_price ?? null,
    lst_price: row?.lst_price ?? null,
  }
}

function parseSetCookie(headers: Headers, jar: Map<string, string>) {
  for (const cookie of headers.getSetCookie?.() ?? []) {
    const [pair] = cookie.split(';')
    const [k, v] = pair.split('=')
    if (k && v) jar.set(k.trim(), v.trim())
  }
}

async function apiReq(method: string, pathname: string, jar: Map<string, string>, body?: unknown) {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
  if (cookie) headers.Cookie = cookie
  if (body) headers['Content-Type'] = 'application/json'
  const res = await fetch(`${apiBase}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
    signal: AbortSignal.timeout(20_000),
  })
  parseSetCookie(res.headers, jar)
  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    json = { _raw: text.slice(0, 400) }
  }
  return { status: res.status, json: json as { data?: unknown } }
}

function unwrap(payload: { data?: unknown } | unknown) {
  return (payload as { data?: unknown })?.data ?? payload
}

async function apiPriceCents(
  jar: Map<string, string>,
  product: { templateId: number; variantId: number | null; name: string },
): Promise<number | null> {
  const slug = String(product.templateId)
  const detail = await apiReq('POST', '/api/v1/catalog/availability/enrich-detail', jar, {
    slug,
    locale: 'IT',
    name: product.name,
    shortDescription: null,
    priceCents: 0,
    priceDisplayMode: 'ex_vat',
    currency: 'EUR',
    imageUrl: null,
    categorySlug: null,
    inStock: true,
    longDescription: null,
    sku: null,
    images: [],
    odooTemplateId: product.templateId,
    variants: product.variantId
      ? [
          {
            ref: String(product.variantId),
            label: product.name,
            imageUrl: null,
            attributes: [],
            odooVariantId: product.variantId,
            priceCents: 0,
            inStock: true,
          },
        ]
      : [],
    seo: { metaTitle: product.name, metaDescription: null, canonical: null, noindex: false },
    alternates: [],
  })
  const enriched = unwrap(detail.json) as {
    priceCents?: number
    variants?: Array<{ ref?: string; priceCents?: number }>
  }
  if (product.variantId) {
    const variant = enriched?.variants?.find((item) => item.ref === String(product.variantId))
    return variant?.priceCents ?? enriched?.priceCents ?? null
  }
  return enriched?.priceCents ?? null
}

async function runApiSmoke(product: { templateId: number; variantId: number | null; name: string }) {
  try {
    const health = await fetch(`${apiBase}/api/v1/health`, { signal: AbortSignal.timeout(4000) })
    if (!health.ok) return { skipped: true, reason: `API ${apiBase} health=${health.status}` }
  } catch (error) {
    return { skipped: true, reason: `API ${apiBase} non raggiungibile (${String(error).slice(0, 120)})` }
  }

  const sessions = {
    anon: new Map<string, string>(),
    b2b: new Map<string, string>(),
    pro: new Map<string, string>(),
  }

  const loginB2b = await apiReq('POST', '/api/v1/auth/login', sessions.b2b, {
    email: USERS.b2b.email,
    password: USERS.b2b.password,
  })
  const loginPro = await apiReq('POST', '/api/v1/auth/login', sessions.pro, {
    email: USERS.pro.email,
    password: USERS.pro.password,
  })

  const [anon, b2b, pro] = await Promise.all([
    apiPriceCents(sessions.anon, product),
    loginB2b.status === 200 ? apiPriceCents(sessions.b2b, product) : Promise.resolve(null),
    loginPro.status === 200 ? apiPriceCents(sessions.pro, product) : Promise.resolve(null),
  ])

  return {
    skipped: false,
    apiBase,
    login: { b2b: loginB2b.status, pro: loginPro.status },
    note:
      loginB2b.status !== 200 || loginPro.status !== 200
        ? `Login test users: crea ${USERS.b2b.email} (BUSINESS) e ${USERS.pro.email} (PROFESSIONAL) sul DB dell’API`
        : null,
    cents: { anon, rivenditori: b2b, installatori: pro },
    differ:
      anon != null && b2b != null && pro != null
        ? { anonVsB2b: anon !== b2b, anonVsPro: anon !== pro, b2bVsPro: b2b !== pro }
        : null,
  }
}

async function priceAll(
  product: { templateId: number; variantId: number | null },
  ids: { retailId: number | null; b2bId: number | null; proId: number | null },
) {
  const rows: PricelistSmokeRow[] = []
  const xmlrpc: Record<string, unknown> = {}
  const specs = [
    {
      key: 'retail' as const,
      label: 'Retail / pubblico',
      pricing: {
        segment: 'RETAIL' as const,
        pricelistId: ids.retailId,
        partnerId: null,
        personalized: false,
      },
    },
    {
      key: 'b2b' as const,
      label: 'Rivenditori',
      pricing: {
        segment: 'BUSINESS' as const,
        pricelistId: ids.b2bId,
        partnerId: Number.isInteger(b2bPartnerId) ? b2bPartnerId : null,
        personalized: true,
      },
    },
    {
      key: 'professional' as const,
      label: 'Installatori',
      pricing: {
        segment: 'PROFESSIONAL' as const,
        pricelistId: ids.proId,
        partnerId: Number.isInteger(proPartnerId) ? proPartnerId : null,
        personalized: true,
      },
    },
  ]

  for (const spec of specs) {
    let cents: number | null = null
    let error: string | undefined
    try {
      cents = await xmlrpcPrice(product, spec.pricing)
    } catch (err) {
      error = `${spec.label}: ${err instanceof Error ? err.message : String(err)}`
    }
    rows.push({
      key: spec.key,
      label: spec.label,
      pricelistId: spec.pricing.pricelistId,
      cents,
      error,
    })
    xmlrpc[spec.key] = {
      pricelistId: spec.pricing.pricelistId,
      partnerId: spec.pricing.partnerId,
      cents,
      euros: cents != null ? cents / 100 : null,
      error: error ?? null,
    }
  }
  return { rows, xmlrpc }
}

async function main() {
  if (!env.ODOO_ENABLED || !isOdooConfigured()) {
    console.log(
      JSON.stringify({ ok: false, error: 'Odoo non configurato (ODOO_ENABLED + credenziali XML-RPC)' }, null, 2),
    )
    process.exit(1)
  }

  let product = await pickProduct()
  const pinned = Number(process.env.TEMPLATE_ID ?? 0) > 0 || Number(process.env.VARIANT_ID ?? 0) > 0
  const [b2bPartner, proPartner, availablePricelists] = await Promise.all([
    partnerPricelist(b2bPartnerId),
    partnerPricelist(proPartnerId),
    listPricelists(),
  ])

  const retailId = resolveListId(env.ODOO_PRICELIST_B2C_ID, null, availablePricelists, [
    /web idea/i,
    /pricelist web/i,
    /pubblic/i,
    /retail/i,
    /b2c/i,
    /\bweb\b/i,
  ])
  const b2bId = resolveListId(env.ODOO_PRICELIST_B2B_ID, b2bPartner?.pricelistId ?? null, availablePricelists, [
    /tlb l3/i,
    /l3 — rivend/i,
    /rivenditore/i,
    /rivend/i,
    /b2b/i,
  ])
  const proId = resolveListId(
    env.ODOO_PRICELIST_PROFESSIONAL_ID,
    proPartner?.pricelistId ?? null,
    availablePricelists,
    [/tlb l2/i, /installator/i, /profession/i],
  )

  const ids = { retailId, b2bId, proId }
  let { rows, xmlrpc } = await priceAll(product, ids)
  let verdict = evaluatePricelistSmoke(rows)

  if (!pinned && verdict.distinctCents <= 1 && (b2bId != null || proId != null)) {
    const alt = await pickProductFromPricelist(b2bId ?? proId ?? 0)
    if (alt) {
      product = alt
      ;({ rows, xmlrpc } = await priceAll(product, ids))
      verdict = evaluatePricelistSmoke(rows)
    }
  }

  const lstPriceProbe =
    product.variantId != null
      ? {
          retail: await probeLstPrice(product.variantId, retailId),
          b2b: await probeLstPrice(product.variantId, b2bId),
          professional: await probeLstPrice(product.variantId, proId),
        }
      : null

  if (
    lstPriceProbe &&
    lstPriceProbe.retail.lst_price != null &&
    lstPriceProbe.b2b.lst_price != null &&
    lstPriceProbe.retail.lst_price !== lstPriceProbe.b2b.lst_price &&
    verdict.distinctCents <= 1
  ) {
    verdict.warnings.push(
      'Odoo `lst_price` cambia col listino, mentre `list_price` (usato dalla PWA) no: i prezzi storefront non seguono rivenditori/installatori.',
    )
  }

  let api: unknown
  try {
    api = skipApi ? { skipped: true, reason: 'SKIP_API=1' } : await runApiSmoke(product)
  } catch (error) {
    api = { skipped: true, reason: error instanceof Error ? error.message : String(error) }
  }

  const report = {
    ok: verdict.ok,
    product: {
      templateId: product.templateId,
      variantId: product.variantId,
      name: product.name,
    },
    envPricelists: {
      ODOO_PRICELIST_B2C_ID: env.ODOO_PRICELIST_B2C_ID ?? null,
      ODOO_PRICELIST_B2B_ID: env.ODOO_PRICELIST_B2B_ID ?? null,
      ODOO_PRICELIST_PROFESSIONAL_ID: env.ODOO_PRICELIST_PROFESSIONAL_ID ?? null,
    },
    resolvedPricelists: { retail: retailId, b2b: b2bId, professional: proId },
    availablePricelists,
    partners: { b2b: b2bPartner, professional: proPartner },
    xmlrpc,
    lstPriceProbe,
    distinctCents: verdict.distinctCents,
    warnings: verdict.warnings,
    errors: verdict.errors,
    api,
  }

  console.log(JSON.stringify(report, null, 2))
  process.exit(verdict.ok ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
