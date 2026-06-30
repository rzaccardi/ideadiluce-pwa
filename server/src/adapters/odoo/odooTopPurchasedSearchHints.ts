import { assertOdooConfigured, isOdooConfigured, odooExecuteKw, type OdooCallContext } from './odooClient.js'

const MAX_QUERY_LENGTH = 120
const SHIPPING_NAME_RE = /spedizion|shipping|trasporto|consegna/i

export type OdooSearchHintCandidate = {
  query: string
  productTemplateId: number
  productName: string
  defaultCode: string | null
  totalQuantity: number
}

export type OdooTopPurchasedProduct = {
  productTemplateId: number
  productName: string
  defaultCode: string | null
  totalQuantity: number
  categoryId: number | null
}

/** Radici categoria Odoo per segmento catalogo storefront. */
export const ODOO_CATEGORY_ARREDO = 59
export const ODOO_CATEGORY_TECNICO = 71

export type TopPurchasedSegment = 'design' | 'technical'

type ReadGroupRow = {
  product_id: [number, string] | false
  product_uom_qty?: number
  product_uom_qty_count?: number
  __count?: number
}

type ProductRow = {
  id: number
  display_name?: string
  default_code?: string | false
  sale_ok?: boolean
  type?: string
  product_tmpl_id: [number, string] | number
}

type TemplateRow = {
  id: number
  name: string
  sale_ok?: boolean
  categ_id?: [number, string] | number | false
}

type CategoryRow = {
  id: number
  parent_id: unknown
}

function relationId(value: [number, string] | number | false | undefined): number | null {
  if (value === false || value == null) return null
  return Array.isArray(value) ? value[0] : value
}

function relationName(value: [number, string] | number | false | undefined): string | null {
  if (!Array.isArray(value)) return null
  return value[1] ?? null
}

function textOrNull(value: string | false | undefined): string | null {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

export function buildSearchQueryFromProduct(name: string, defaultCode?: string | null): string {
  const cleanName = name.trim().replace(/\s+/g, ' ')
  const code = defaultCode?.trim()

  if (code && code.length >= 3 && !cleanName.toLowerCase().startsWith(code.toLowerCase())) {
    if (code.length <= 24) return code.slice(0, MAX_QUERY_LENGTH)
    return `${code} ${cleanName}`.slice(0, MAX_QUERY_LENGTH).trim()
  }

  return cleanName.slice(0, MAX_QUERY_LENGTH)
}

function isSellableProduct(product: ProductRow, template: TemplateRow | undefined): boolean {
  if (product.type === 'service') return false
  if (product.sale_ok === false) return false
  if (template?.sale_ok === false) return false

  const label = (product.display_name ?? template?.name ?? '').trim()
  if (!label || SHIPPING_NAME_RE.test(label)) return false

  return true
}

async function fetchTopProductsByReadGroup(
  ctx: OdooCallContext,
  sinceOdoo: string,
  fetchLimit: number,
): Promise<Array<{ productId: number; totalQuantity: number }>> {
  const domain: unknown[] = [
    ['order_id.state', 'in', ['sale', 'done']],
    ['order_id.date_order', '>=', sinceOdoo],
  ]

  const rows = await odooExecuteKw<ReadGroupRow[]>(
    ctx,
    'sale.order.line',
    'read_group',
    [domain, ['product_uom_qty'], ['product_id']],
    {
      orderby: 'product_uom_qty desc',
      limit: fetchLimit,
    },
  )

  return rows
    .map((row) => {
      const productId = relationId(row.product_id)
      const totalQuantity = Math.round(Number(row.product_uom_qty) || 0)
      if (!productId || totalQuantity < 1) return null
      return { productId, totalQuantity }
    })
    .filter((row): row is { productId: number; totalQuantity: number } => row != null)
}

function categoryParentId(value: unknown): number | null {
  if (value === false || value == null) return null
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0]
  return null
}

async function fetchCategoryDescendantIds(
  ctx: OdooCallContext,
  rootIds: number[],
): Promise<Set<number>> {
  const roots = [...new Set(rootIds.filter((id) => Number.isInteger(id) && id > 0))]
  if (roots.length === 0) return new Set()

  const rows = await odooExecuteKw<CategoryRow[]>(ctx, 'product.category', 'search_read', [[]], {
    fields: ['id', 'parent_id'],
    limit: 500,
  })

  const childrenByParent = new Map<number, number[]>()
  for (const row of rows) {
    const parentId = categoryParentId(row.parent_id)
    if (parentId == null) continue
    const list = childrenByParent.get(parentId) ?? []
    list.push(row.id)
    childrenByParent.set(parentId, list)
  }

  const allowed = new Set<number>()
  const queue = [...roots]
  while (queue.length > 0) {
    const id = queue.shift()!
    if (allowed.has(id)) continue
    allowed.add(id)
    const children = childrenByParent.get(id) ?? []
    queue.push(...children)
  }

  return allowed
}

function segmentRootIds(segment?: TopPurchasedSegment): number[] | undefined {
  if (segment === 'design') return [ODOO_CATEGORY_ARREDO]
  if (segment === 'technical') return [ODOO_CATEGORY_TECNICO]
  return undefined
}

async function aggregateTopPurchasedByTemplate(
  ctx: OdooCallContext,
  options: {
    lookbackDays: number
    limit: number
    segment?: TopPurchasedSegment
    fetchMultiplier?: number
  },
): Promise<OdooTopPurchasedProduct[]> {
  assertOdooConfigured()

  const lookbackDays = Math.max(1, Math.min(options.lookbackDays, 365))
  const limit = Math.max(1, Math.min(options.limit, 24))
  const fetchMultiplier = options.fetchMultiplier ?? 4
  const since = new Date(Date.now() - lookbackDays * 86_400_000)
  const sinceOdoo = since.toISOString().slice(0, 19).replace('T', ' ')

  const allowedCategoryIds =
    options.segment != null
      ? await fetchCategoryDescendantIds(ctx, segmentRootIds(options.segment) ?? [])
      : null

  const rankedProducts = await fetchTopProductsByReadGroup(
    ctx,
    sinceOdoo,
    limit * fetchMultiplier,
  )
  if (rankedProducts.length === 0) return []

  const productIds = rankedProducts.map((row) => row.productId)
  const products = await odooExecuteKw<ProductRow[]>(ctx, 'product.product', 'read', [productIds], {
    fields: ['display_name', 'default_code', 'sale_ok', 'type', 'product_tmpl_id'],
  })

  const templateIds = [
    ...new Set(
      products
        .map((product) => relationId(product.product_tmpl_id))
        .filter((id): id is number => id != null),
    ),
  ]

  const templates = templateIds.length
    ? await odooExecuteKw<TemplateRow[]>(ctx, 'product.template', 'read', [templateIds], {
        fields: ['name', 'sale_ok', 'categ_id'],
      })
    : []

  const productById = new Map(products.map((product) => [product.id, product]))
  const templateById = new Map(templates.map((template) => [template.id, template]))
  const byTemplate = new Map<number, OdooTopPurchasedProduct>()

  for (const ranked of rankedProducts) {
    const product = productById.get(ranked.productId)
    if (!product) continue

    const templateId = relationId(product.product_tmpl_id)
    if (!templateId) continue

    const template = templateById.get(templateId)
    if (!isSellableProduct(product, template)) continue

    const categoryId = relationId(template?.categ_id)
    if (allowedCategoryIds && (categoryId == null || !allowedCategoryIds.has(categoryId))) {
      continue
    }

    const productName = (template?.name ?? relationName(product.product_tmpl_id) ?? product.display_name ?? '').trim()
    if (!productName) continue

    const defaultCode = textOrNull(product.default_code)
    const existing = byTemplate.get(templateId)
    if (existing) {
      existing.totalQuantity += ranked.totalQuantity
      continue
    }

    byTemplate.set(templateId, {
      productTemplateId: templateId,
      productName,
      defaultCode,
      totalQuantity: ranked.totalQuantity,
      categoryId,
    })
  }

  return [...byTemplate.values()]
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit)
}

export async function fetchTopPurchasedProducts(
  ctx: OdooCallContext,
  options: {
    lookbackDays: number
    limit: number
    segment?: TopPurchasedSegment
    fetchMultiplier?: number
  },
): Promise<OdooTopPurchasedProduct[]> {
  return aggregateTopPurchasedByTemplate(ctx, options)
}

export async function fetchTopPurchasedSearchHints(
  ctx: OdooCallContext,
  options: { lookbackDays: number; limit: number },
): Promise<OdooSearchHintCandidate[]> {
  const products = await aggregateTopPurchasedByTemplate(ctx, options)
  return products
    .map((item) => ({
      query: buildSearchQueryFromProduct(item.productName, item.defaultCode),
      productTemplateId: item.productTemplateId,
      productName: item.productName,
      defaultCode: item.defaultCode,
      totalQuantity: item.totalQuantity,
    }))
    .filter((item) => item.query)
}

export function odooSearchHintsAvailable(): boolean {
  return isOdooConfigured()
}
