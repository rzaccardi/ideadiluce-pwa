import { env } from '../../config/env.js'
import { buildTechnicalCardSpecTags } from '../../lib/technical-card-spec-tags.js'
import type { HubLocale } from '../../lib/hub-locale.js'
import type { ProductCardDTO, ProductListDTO } from '../../types/dto.js'
import { odooExecuteKw, type OdooCallContext } from '../../adapters/odoo/odooClient.js'
import type { PricingContext } from '../pricing/pricelist.service.js'
import {
  ODOO_CATEGORY_SLUG_ROOT_ALIASES,
  ODOO_SPEC_MODEL,
  ODOO_SPEC_OPTION_MODEL,
  ODOO_SPEC_TYPE_ATTACCO,
  ODOO_SPEC_TYPE_COLOR_TEMP,
} from './odoo-catalog.constants.js'
import {
  brandSlugLookupKeys,
  canonicalizeBrandSlug,
  slugifyBrandName,
  slugifyCatalogToken,
} from './odoo-catalog-slug.js'
import type { CatalogSpecFilters } from './catalog-spec-filter.js'
import { sanitizeAttaccoParam, sanitizeColorTempParam } from './catalog-spec-filter.js'

type TemplateRow = {
  id: number
  name: string
  idl_ecom_slug?: string | false
  idl_ecom_short_description?: string | false
  ecom_short_description?: string | false
  list_price: number
  currency_id: unknown
  categ_id?: unknown
  product_brand_id?: unknown
  ced?: string | false
  manufacturer_code?: string | false
  default_code?: string | false
  spec_ids?: number[]
}

type SpecRow = {
  id: number
  product_tmpl_id: [number, string] | number
  spec_type_id: [number, string] | false
  value_display?: string | false
}

type CategoryRow = {
  id: number
  name: string
  parent_id: unknown
}

type BrandRow = {
  id: number
  name: string
}

type SpecOptionRow = {
  id: number
  name: string
}

const TEMPLATE_LIST_FIELDS = [
  'name',
  'idl_ecom_slug',
  'idl_ecom_short_description',
  'ecom_short_description',
  'list_price',
  'currency_id',
  'categ_id',
  'product_brand_id',
  'ced',
  'manufacturer_code',
  'default_code',
  'spec_ids',
] as const

function catalogContext(pricing?: PricingContext | null) {
  const context: Record<string, unknown> = { lang: env.ODOO_CATALOG_LANG }
  if (pricing?.pricelistId) context.pricelist = pricing.pricelistId
  if (pricing?.partnerId) context.partner_id = pricing.partnerId
  return context
}

function m2oId(value: unknown): number | null {
  if (value == null || value === false) return null
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0]
  return null
}

function m2oLabel(value: unknown): string | null {
  if (!Array.isArray(value) || typeof value[1] !== 'string') return null
  return value[1]
}

function textOrNull(value: unknown): string | null {
  if (value == null || value === false) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || null
  }
  return null
}

function parseProductDomain(raw: string | undefined): unknown[] {
  if (!raw?.trim()) return [['sale_ok', '=', true]]
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as unknown[]) : [['sale_ok', '=', true]]
  } catch {
    return [['sale_ok', '=', true]]
  }
}

function storefrontWebsiteId(): number {
  return env.ODOO_WEBSITE_ID > 0 ? env.ODOO_WEBSITE_ID : 2
}

function imageUrlForTemplate(templateId: number): string | null {
  const base = env.ODOO_CATALOG_BASE_URL?.trim().replace(/\/$/, '')
  if (!base) return null
  return `${base}/web/image/product.template/${templateId}/image_128`
}

function slugForTemplate(row: TemplateRow): string | null {
  return textOrNull(row.idl_ecom_slug)
}

function shortDescriptionForTemplate(row: TemplateRow): string | null {
  return textOrNull(row.idl_ecom_short_description) ?? textOrNull(row.ecom_short_description)
}

function skuForTemplate(row: TemplateRow): string | null {
  return textOrNull(row.manufacturer_code) ?? textOrNull(row.ced) ?? textOrNull(row.default_code)
}

function andDomain(domain: unknown[], condition: unknown[]): unknown[] {
  return [...domain, condition]
}

function orDomain(conditions: unknown[][]): unknown[] {
  if (conditions.length === 0) return []
  if (conditions.length === 1) return conditions[0]!
  return [...Array.from({ length: conditions.length - 1 }, () => '|'), ...conditions]
}

function categorySlugFromMap(
  categMap: Map<number, { slug: string; parentId: number | null }> | null,
  categoryId: number | null,
  categValue?: unknown,
): string | null {
  if (categoryId == null) return null
  const fromMap = categMap?.get(categoryId)?.slug
  if (fromMap) return fromMap
  const name = m2oLabel(categValue)
  if (name) return `${slugifyCatalogToken(name)}-${categoryId}`
  return null
}

type CategoryMap = Map<number, { slug: string; parentId: number | null }>

const CATEGORY_MAP_TTL_MS = 5 * 60 * 1000
let categoryMapCache: { at: number; map: CategoryMap } | null = null
const BRAND_MAP_TTL_MS = 5 * 60 * 1000
let brandMapCache: { at: number; bySlug: Map<string, number> } | null = null

async function loadCategorySlugMap(ctx: OdooCallContext): Promise<CategoryMap> {
  if (categoryMapCache && Date.now() - categoryMapCache.at < CATEGORY_MAP_TTL_MS) {
    return categoryMapCache.map
  }

  const rows = await odooExecuteKw<CategoryRow[]>(ctx, 'product.category', 'search_read', [[]], {
    fields: ['name', 'parent_id'],
    context: catalogContext(),
  })
  const map: CategoryMap = new Map()
  for (const row of rows) {
    map.set(row.id, {
      slug: `${slugifyCatalogToken(row.name)}-${row.id}`,
      parentId: m2oId(row.parent_id),
    })
  }
  categoryMapCache = { at: Date.now(), map }
  return map
}

/** Alias Odoo o slug `nome-123` → id radice (per `child_of`). */
function resolveCategoryRootIdFast(categorySlug: string): number | null {
  const normalized = categorySlug.trim().toLowerCase()
  const aliasRoot = ODOO_CATEGORY_SLUG_ROOT_ALIASES[normalized]
  if (aliasRoot != null) return aliasRoot
  const trailing = normalized.match(/-(\d+)$/)
  if (trailing) {
    const id = Number(trailing[1])
    return Number.isInteger(id) && id > 0 ? id : null
  }
  return null
}

async function resolveCategoryRootId(
  categorySlug: string,
  categMap: CategoryMap | null,
): Promise<number | null> {
  const fast = resolveCategoryRootIdFast(categorySlug)
  if (fast != null) return fast
  if (!categMap) return null

  const normalized = categorySlug.trim().toLowerCase()
  const direct = [...categMap.entries()].find(([, info]) => info.slug === normalized)?.[0]
  if (direct != null) return direct

  const byName = [...categMap.entries()].find(([, info]) => info.slug.startsWith(`${normalized}-`))?.[0]
  return byName ?? null
}

async function resolveBrandIdBySlug(ctx: OdooCallContext, brandSlug: string): Promise<number | null> {
  const keys = brandSlugLookupKeys(brandSlug)
  if (brandMapCache && Date.now() - brandMapCache.at < BRAND_MAP_TTL_MS) {
    for (const key of keys) {
      const id = brandMapCache.bySlug.get(key)
      if (id != null) return id
    }
    return null
  }
  const rows = await odooExecuteKw<BrandRow[]>(ctx, 'product.brand', 'search_read', [[]], {
    fields: ['name'],
    context: catalogContext(),
  })
  const bySlug = new Map<string, number>()
  for (const row of rows) {
    const slug = slugifyBrandName(row.name)
    bySlug.set(slug, row.id)
    bySlug.set(canonicalizeBrandSlug(slug), row.id)
    for (const alias of brandSlugLookupKeys(slug)) {
      bySlug.set(alias, row.id)
    }
  }
  brandMapCache = { at: Date.now(), bySlug }
  for (const key of keys) {
    const id = bySlug.get(key)
    if (id != null) return id
  }
  return null
}

async function resolveAttaccoOptionId(ctx: OdooCallContext, attacco: string): Promise<number | null> {
  const normalized = sanitizeAttaccoParam(attacco)
  if (!normalized) return null
  const rows = await odooExecuteKw<SpecOptionRow[]>(
    ctx,
    ODOO_SPEC_OPTION_MODEL,
    'search_read',
    [[['name', '=', normalized.toUpperCase()]]],
    { fields: ['name'], limit: 1, context: catalogContext() },
  )
  return rows[0]?.id ?? null
}

function kelvinInteger(colorTemp: string): number | null {
  const normalized = sanitizeColorTempParam(colorTemp)
  if (!normalized) return null
  const digits = normalized.replace(/K$/i, '')
  const value = Number(digits)
  return Number.isInteger(value) && value > 0 ? value : null
}

async function resolveTemplateIdsBySpecFilters(
  ctx: OdooCallContext,
  specFilters: CatalogSpecFilters,
): Promise<number[] | null> {
  let templateIds: Set<number> | null = null

  if (specFilters.attacco) {
    const optionId = await resolveAttaccoOptionId(ctx, specFilters.attacco)
    if (optionId == null) return []
    const rows = await odooExecuteKw<Array<{ product_tmpl_id: [number, string] | number }>>(
      ctx,
      ODOO_SPEC_MODEL,
      'search_read',
      [[['spec_type_id', '=', ODOO_SPEC_TYPE_ATTACCO], ['value_selection_id', '=', optionId]]],
      { fields: ['product_tmpl_id'], limit: 5000, context: catalogContext() },
    )
    const ids = new Set(
      rows.map((row) => m2oId(row.product_tmpl_id)).filter((id): id is number => id != null),
    )
    templateIds = ids
  }

  if (specFilters.colorTemp) {
    const kelvin = kelvinInteger(specFilters.colorTemp)
    if (kelvin == null) return []
    const rows = await odooExecuteKw<Array<{ product_tmpl_id: [number, string] | number }>>(
      ctx,
      ODOO_SPEC_MODEL,
      'search_read',
      [[['spec_type_id', '=', ODOO_SPEC_TYPE_COLOR_TEMP], ['value_integer', '=', kelvin]]],
      { fields: ['product_tmpl_id'], limit: 5000, context: catalogContext() },
    )
    const ids = new Set(
      rows.map((row) => m2oId(row.product_tmpl_id)).filter((id): id is number => id != null),
    )
    templateIds = templateIds ? new Set([...templateIds].filter((id) => ids.has(id))) : ids
  }

  return templateIds ? [...templateIds] : null
}

async function loadSpecsByTemplateIds(
  ctx: OdooCallContext,
  templateIds: number[],
): Promise<Map<number, SpecRow[]>> {
  const map = new Map<number, SpecRow[]>()
  if (templateIds.length === 0) return map

  const rows = await odooExecuteKw<SpecRow[]>(
    ctx,
    ODOO_SPEC_MODEL,
    'search_read',
    [[['product_tmpl_id', 'in', templateIds]]],
    {
      fields: ['product_tmpl_id', 'spec_type_id', 'value_display'],
      limit: Math.min(templateIds.length * 20, 5000),
      context: catalogContext(),
    },
  )

  for (const row of rows) {
    const templateId = m2oId(row.product_tmpl_id)
    if (templateId == null) continue
    const bucket = map.get(templateId) ?? []
    bucket.push(row)
    map.set(templateId, bucket)
  }

  return map
}

function mapTemplateToCard(
  row: TemplateRow,
  locale: HubLocale,
  categMap: CategoryMap | null,
  specs: SpecRow[] | undefined,
): ProductCardDTO | null {
  const slug = slugForTemplate(row)
  if (!slug) return null

  const specTags = buildTechnicalCardSpecTags({
    name: row.name,
    shortDescription: shortDescriptionForTemplate(row),
    specTags: specs
      ?.map((spec) => textOrNull(spec.value_display))
      .filter((value): value is string => Boolean(value)),
  })

  const brandName = m2oLabel(row.product_brand_id)
  const brand =
    brandName != null
      ? { slug: slugifyBrandName(brandName), name: brandName }
      : null

  const categoryId = m2oId(row.categ_id)
  const currency = m2oLabel(row.currency_id) ?? 'EUR'

  return {
    slug,
    locale,
    name: row.name,
    shortDescription: shortDescriptionForTemplate(row),
    specTags: specTags.length ? specTags : undefined,
    priceCents: Math.round(Number(row.list_price || 0) * 100),
    priceDisplayMode: 'ex_vat',
    currency,
    imageUrl: imageUrlForTemplate(row.id),
    categorySlug: categorySlugFromMap(categMap, categoryId, row.categ_id),
    brand,
    sku: skuForTemplate(row),
    odooTemplateId: row.id,
  }
}

function buildTextSearchDomain(query: string): unknown[] {
  const token = query.trim()
  if (!token) return []

  // idl_ecom_slug / idl_ecom_title con ilike matchano l'intero catalogo su Odoo: escluderli.
  return orDomain([
    ['name', 'ilike', token],
    ['ecom_title', 'ilike', token],
    ['default_code', 'ilike', token],
    ['ced', 'ilike', token],
    ['manufacturer_code', 'ilike', token],
  ])
}

async function buildSearchDomain(
  ctx: OdooCallContext,
  input: {
    q?: string
    categorySlug?: string
    brandSlug?: string
    specFilters: CatalogSpecFilters
  },
): Promise<{ domain: unknown[]; categMap: CategoryMap | null }> {
  let domain: unknown[] = [
    ...parseProductDomain(env.ODOO_PRODUCT_DOMAIN),
    ['website_published', '=', true],
    ['tlb_target_website_ids', 'in', [storefrontWebsiteId()]],
    ['idl_ecom_slug', '!=', false],
  ]

  let categMap: CategoryMap | null = null
  const categorySlug = input.categorySlug?.trim()
  if (categorySlug) {
    let rootId = resolveCategoryRootIdFast(categorySlug)
    if (rootId == null) {
      categMap = await loadCategorySlugMap(ctx)
      rootId = await resolveCategoryRootId(categorySlug, categMap)
    }
    if (rootId == null) {
      return { domain: [['id', '=', 0]], categMap }
    }
    // child_of nativo Odoo: evita search_read di tutte le categorie + `in` gigante.
    domain = andDomain(domain, ['categ_id', 'child_of', rootId])
  }

  if (input.brandSlug?.trim()) {
    const brandId = await resolveBrandIdBySlug(ctx, input.brandSlug)
    if (brandId == null) {
      return { domain: [['id', '=', 0]], categMap }
    }
    domain = andDomain(domain, ['product_brand_id', '=', brandId])
  }

  const textDomain = buildTextSearchDomain(input.q ?? '')
  if (textDomain.length > 0) {
    domain = [...domain, ...textDomain]
  }

  const specTemplateIds = await resolveTemplateIdsBySpecFilters(ctx, input.specFilters)
  if (specTemplateIds != null) {
    if (specTemplateIds.length === 0) {
      return { domain: [['id', '=', 0]], categMap }
    }
    domain = andDomain(domain, ['id', 'in', specTemplateIds])
  }

  return { domain, categMap }
}

export async function searchOdooCatalogProducts(
  ctx: OdooCallContext,
  input: {
    locale: HubLocale
    page: number
    pageSize: number
    q?: string
    categorySlug?: string
    brandSlug?: string
    attacco?: string
    colorTemp?: string
    pricing?: PricingContext | null
  },
): Promise<ProductListDTO> {
  const page = Math.max(1, input.page)
  const pageSize = Math.min(60, Math.max(1, input.pageSize))
  const offset = (page - 1) * pageSize

  const specFilters: CatalogSpecFilters = {
    attacco: sanitizeAttaccoParam(input.attacco),
    colorTemp: sanitizeColorTempParam(input.colorTemp),
  }

  const { domain, categMap } = await buildSearchDomain(ctx, {
    q: input.q,
    categorySlug: input.categorySlug,
    brandSlug: input.brandSlug,
    specFilters,
  })

  const odooContext = catalogContext(input.pricing)

  const [total, rows] = await Promise.all([
    odooExecuteKw<number>(ctx, 'product.template', 'search_count', [domain], {
      context: odooContext,
    }),
    odooExecuteKw<TemplateRow[]>(ctx, 'product.template', 'search_read', [domain], {
      fields: [...TEMPLATE_LIST_FIELDS],
      limit: pageSize,
      offset,
      order: 'name asc',
      context: odooContext,
    }),
  ])

  const templateIds = rows.map((row) => row.id)
  const specsByTemplate = await loadSpecsByTemplateIds(ctx, templateIds)

  const items = rows
    .map((row) => mapTemplateToCard(row, input.locale, categMap, specsByTemplate.get(row.id)))
    .filter((item): item is ProductCardDTO => item != null)

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

export async function listOdooStorefrontProductSlugs(ctx: OdooCallContext): Promise<string[]> {
  const domain: unknown[] = [
    ...parseProductDomain(env.ODOO_PRODUCT_DOMAIN),
    ['website_published', '=', true],
    ['tlb_target_website_ids', 'in', [storefrontWebsiteId()]],
    ['idl_ecom_slug', '!=', false],
  ]

  const rows = await odooExecuteKw<Array<{ idl_ecom_slug: string | false }>>(
    ctx,
    'product.template',
    'search_read',
    [domain],
    {
      fields: ['idl_ecom_slug'],
      limit: 5000,
      context: catalogContext(),
    },
  )

  return rows.map((row) => textOrNull(row.idl_ecom_slug)).filter((slug): slug is string => Boolean(slug))
}
