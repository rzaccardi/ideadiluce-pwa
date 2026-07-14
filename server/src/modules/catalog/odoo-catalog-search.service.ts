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
import { slugifyBrandName, slugifyCatalogToken } from './odoo-catalog-slug.js'
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
  return env.ARFLY_WEBSITE_ID > 0 ? env.ARFLY_WEBSITE_ID : 2
}

function imageUrlForTemplate(templateId: number): string | null {
  const base = env.ARFLY_API_BASE_URL?.trim().replace(/\/$/, '')
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
  categMap: Map<number, { slug: string; parentId: number | null }>,
  categoryId: number | null,
): string | null {
  if (categoryId == null) return null
  return categMap.get(categoryId)?.slug ?? null
}

async function loadCategorySlugMap(ctx: OdooCallContext): Promise<
  Map<number, { slug: string; parentId: number | null }>
> {
  const rows = await odooExecuteKw<CategoryRow[]>(ctx, 'product.category', 'search_read', [[]], {
    fields: ['name', 'parent_id'],
    context: catalogContext(),
  })
  const map = new Map<number, { slug: string; parentId: number | null }>()
  for (const row of rows) {
    map.set(row.id, {
      slug: `${slugifyCatalogToken(row.name)}-${row.id}`,
      parentId: m2oId(row.parent_id),
    })
  }
  return map
}

function descendantCategoryIds(
  categMap: Map<number, { slug: string; parentId: number | null }>,
  rootId: number,
): number[] {
  const ids = new Set<number>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const [id, info] of categMap) {
      if (info.parentId != null && ids.has(info.parentId) && !ids.has(id)) {
        ids.add(id)
        changed = true
      }
    }
  }
  return [...ids]
}

async function resolveCategoryFilterIds(
  categorySlug: string,
  categMap: Map<number, { slug: string; parentId: number | null }>,
): Promise<number[]> {
  const normalized = categorySlug.trim().toLowerCase()
  const aliasRoot = ODOO_CATEGORY_SLUG_ROOT_ALIASES[normalized]
  if (aliasRoot != null) return descendantCategoryIds(categMap, aliasRoot)

  const direct = [...categMap.entries()].find(([, info]) => info.slug === normalized)?.[0]
  if (direct != null) return descendantCategoryIds(categMap, direct)

  const byName = [...categMap.entries()].find(([, info]) => info.slug.startsWith(`${normalized}-`))?.[0]
  if (byName != null) return descendantCategoryIds(categMap, byName)

  return []
}

async function resolveBrandIdBySlug(ctx: OdooCallContext, brandSlug: string): Promise<number | null> {
  const normalized = brandSlug.trim().toLowerCase()
  const rows = await odooExecuteKw<BrandRow[]>(ctx, 'product.brand', 'search_read', [[]], {
    fields: ['name'],
    context: catalogContext(),
  })
  for (const row of rows) {
    if (slugifyBrandName(row.name) === normalized) return row.id
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
  categMap: Map<number, { slug: string; parentId: number | null }>,
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
    categorySlug: categorySlugFromMap(categMap, categoryId),
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
): Promise<{ domain: unknown[]; categMap: Map<number, { slug: string; parentId: number | null }> }> {
  const categMap = await loadCategorySlugMap(ctx)
  let domain: unknown[] = [
    ...parseProductDomain(env.ODOO_PRODUCT_DOMAIN),
    ['website_published', '=', true],
    ['tlb_target_website_ids', 'in', [storefrontWebsiteId()]],
    ['idl_ecom_slug', '!=', false],
  ]

  if (input.categorySlug?.trim()) {
    const categoryIds = await resolveCategoryFilterIds(input.categorySlug, categMap)
    if (categoryIds.length === 0) {
      return { domain: [['id', '=', 0]], categMap }
    }
    domain = andDomain(domain, ['categ_id', 'in', categoryIds])
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

  const total = await odooExecuteKw<number>(ctx, 'product.template', 'search_count', [domain], {
    context: odooContext,
  })

  const rows = await odooExecuteKw<TemplateRow[]>(ctx, 'product.template', 'search_read', [domain], {
    fields: [...TEMPLATE_LIST_FIELDS],
    limit: pageSize,
    offset,
    order: 'name asc',
    context: odooContext,
  })

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
