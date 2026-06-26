/**
 * Catalogo Odoo 18 via `execute_kw`.
 * Gli slug esposti sono derivati localmente da `name` + `id`, perché i campi `slug` /
 * `website_slug` non sono garantiti su tutti i database Odoo.
 */
import { env } from '../../config/env.js'
import { splitProductDescription } from '../../lib/product-description-split.js'
import { defaultProductAlternates, defaultProductSeo } from '../../lib/product-seo-defaults.js'
import type {
  CategoryDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ProductVariantDTO,
} from '../../types/dto.js'
import { odooExecuteKw, type OdooCallContext } from './odooClient.js'
import type { OdooCatalogAdapter } from './odooCatalogAdapter.js'

function slugify(name: string, id: number): string {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 60)
  return base ? `${base}-${id}` : `p-${id}`
}

function idFromSlug(slug: string): number | null {
  const match = /-(\d+)$/.exec(slug) ?? /^p-(\d+)$/.exec(slug)
  if (!match) return null
  const id = Number(match[1])
  return Number.isInteger(id) && id > 0 ? id : null
}

function m2oId(v: unknown): number | null {
  if (v == null || v === false) return null
  if (Array.isArray(v) && typeof v[0] === 'number') return v[0]
  return null
}

function m2oLabel(v: unknown): string | null {
  if (Array.isArray(v) && typeof v[1] === 'string') return v[1]
  return null
}

function textOrNull(v: unknown): string | null {
  if (v == null || v === false) return null
  if (typeof v === 'string') return v || null
  return null
}

function mimeTypeFromBase64Image(value: string): string {
  if (value.startsWith('/9j/')) return 'image/jpeg'
  if (value.startsWith('iVBORw0KGgo')) return 'image/png'
  if (value.startsWith('R0lGOD')) return 'image/gif'
  if (value.startsWith('UklGR')) return 'image/webp'
  if (value.startsWith('PHN2Zy')) return 'image/svg+xml'
  return 'image/png'
}

function imageDataUrl(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const base64 = v.replace(/\s/g, '')
  if (!base64) return null
  return `data:${mimeTypeFromBase64Image(base64)};base64,${base64}`
}

function parseDomain(raw: string | undefined, fallback: unknown[]): unknown[] {
  if (!raw?.trim()) return fallback
  try {
    const d = JSON.parse(raw) as unknown
    return Array.isArray(d) ? (d as unknown[]) : fallback
  } catch {
    return fallback
  }
}

function andDomain(domain: unknown[], condition: unknown[]): unknown[] {
  return [...domain, condition]
}

type TemplateRow = {
  id: number
  name: string
  description_sale?: string | false
  description?: string | false
  list_price: number
  currency_id: unknown
  product_variant_ids: number[]
  categ_id?: unknown
  image_128?: string | false
  image_512?: string | false
}

type VariantRow = {
  id: number
  display_name?: string
  default_code?: string | false
}

type CategoryRow = {
  id: number
  name: string
  parent_id: unknown
}

type CategoryInfo = {
  slug: string
  parentId: number | null
}

const TEMPLATE_FIELDS = [
  'name',
  'description_sale',
  'description',
  'list_price',
  'currency_id',
  'product_variant_ids',
  'categ_id',
  'image_128',
  'image_512',
] as const

function templateToCard(row: TemplateRow, categorySlug: string | null): ProductCardDTO {
  const slug = slugify(row.name, row.id)
  const currency = m2oLabel(row.currency_id) ?? 'EUR'
  const priceCents = Math.round(Number(row.list_price || 0) * 100)
  const shortDescription = textOrNull(row.description_sale)
  return {
    slug,
    locale: 'IT',
    name: row.name,
    shortDescription,
    priceCents,
    priceDisplayMode: 'ex_vat',
    currency,
    imageUrl: imageDataUrl(row.image_128),
    categorySlug,
  }
}

function mapProductDetail(
  row: TemplateRow,
  categMap: Map<number, CategoryInfo>,
  variants: ProductVariantDTO[],
): ProductDetailDTO {
  const categoryId = m2oId(row.categ_id)
  const categorySlug = categoryId != null ? categorySlugById(categMap, categoryId) : null
  const card = templateToCard(row, categorySlug)
  const inStock = true
  const slug = slugify(row.name, row.id)
  const imageUrl = imageDataUrl(row.image_512) ?? card.imageUrl
  const longRaw = textOrNull(row.description) ?? textOrNull(row.description_sale)
  const { descriptionHtml, additionalInfoTableHtml, specsTableHtml } =
    splitProductDescription(longRaw)
  return {
    ...card,
    slug,
    imageUrl,
    images: imageUrl ? [imageUrl] : [],
    odooTemplateId: row.id,
    longDescription: descriptionHtml,
    additionalInfoTableHtml,
    specsTableHtml,
    categories: categorySlug ? [{ slug: categorySlug, name: categorySlug }] : [],
    brand: null,
    sku: row.product_variant_ids?.[0] != null ? `VAR-${row.product_variant_ids[0]}` : null,
    inStock,
    variants,
    seo: defaultProductSeo(row.name, slug, textOrNull(row.description_sale)),
    alternates: defaultProductAlternates(slug),
  }
}

async function resolveProductVariants(
  ctx: OdooCallContext,
  template: TemplateRow,
): Promise<ProductVariantDTO[]> {
  const ids = template.product_variant_ids ?? []
  if (ids.length === 0) return []

  const rows = await odooExecuteKw<VariantRow[]>(
    ctx,
    'product.product',
    'read',
    [ids],
    { fields: ['display_name', 'default_code'], context: catalogContext() },
  )
  const byId = new Map(rows.map((row) => [row.id, row]))

  return ids.map((id) => {
    const row = byId.get(id)
    const code = textOrNull(row?.default_code)
    const label = row?.display_name?.trim() || code || `${template.name} - ${id}`
    return {
      ref: `VAR-${id}`,
      label: code && !label.includes(code) ? `${label} (${code})` : label,
      imageUrl: null,
      attributes: [],
      odooVariantId: id,
    }
  })
}

const catalogContext = () => ({ lang: env.ODOO_CATALOG_LANG })

async function resolveCategorySlugMap(ctx: OdooCallContext): Promise<Map<number, CategoryInfo>> {
  const domain = parseDomain(env.ODOO_CATEGORY_DOMAIN, [])
  const rows = await odooExecuteKw<CategoryRow[]>(
    ctx,
    'product.category',
    'search_read',
    [domain],
    { fields: ['id', 'name', 'parent_id'], context: catalogContext() },
  )
  const map = new Map<number, CategoryInfo>()
  for (const r of rows) {
    const slug = slugify(r.name, r.id)
    map.set(r.id, { slug, parentId: m2oId(r.parent_id) })
  }
  return map
}

function categorySlugById(categMap: Map<number, CategoryInfo>, id: number): string | null {
  return categMap.get(id)?.slug ?? null
}

function categoryAndDescendantIds(categMap: Map<number, CategoryInfo>, categoryId: number): number[] {
  const ids = new Set<number>([categoryId])
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

async function resolveCategoryIdsWithProducts(
  ctx: OdooCallContext,
  categMap: Map<number, CategoryInfo>,
): Promise<Set<number>> {
  const baseDomain = parseDomain(env.ODOO_PRODUCT_DOMAIN, [['sale_ok', '=', true]])
  const rows = await odooExecuteKw<Pick<TemplateRow, 'categ_id'>[]>(
    ctx,
    'product.template',
    'search_read',
    [baseDomain],
    { fields: ['categ_id'], context: catalogContext() },
  )
  const ids = new Set<number>()

  for (const row of rows) {
    let id = m2oId(row.categ_id)
    while (id != null && !ids.has(id)) {
      ids.add(id)
      id = categMap.get(id)?.parentId ?? null
    }
  }

  return ids
}

export function createLiveOdooCatalogAdapter(): OdooCatalogAdapter {
  return {
    async getCategories(ctx: OdooCallContext) {
      const domain = parseDomain(env.ODOO_CATEGORY_DOMAIN, [])
      const rows = await odooExecuteKw<CategoryRow[]>(
        ctx,
        'product.category',
        'search_read',
        [domain],
        { fields: ['id', 'name', 'parent_id'], context: catalogContext() },
      )
      const categMap = new Map(
        rows.map((r) => [r.id, { slug: slugify(r.name, r.id), parentId: m2oId(r.parent_id) }]),
      )
      const idsWithProducts = await resolveCategoryIdsWithProducts(ctx, categMap)

      return rows.filter((r) => idsWithProducts.has(r.id)).map(
        (r): CategoryDTO => ({
          id: String(r.id),
          slug: slugify(r.name, r.id),
          name: r.name,
          parentId: m2oId(r.parent_id) != null ? String(m2oId(r.parent_id)) : null,
        }),
      )
    },

    async getProducts(ctx: OdooCallContext, filter, pagination = { page: 1, pageSize: 24 }) {
      const baseDomain = parseDomain(env.ODOO_PRODUCT_DOMAIN, [['sale_ok', '=', true]])
      const { page, pageSize } = pagination
      const offset = (page - 1) * pageSize
      let domain: unknown[] = [...baseDomain]
      const categSlug = filter?.categorySlug
      const q = filter?.q?.trim()

      if (categSlug) {
        const categMap = await resolveCategorySlugMap(ctx)
        const selectedId = [...categMap.entries()].find(([, c]) => c.slug === categSlug)?.[0]
        const ids = selectedId != null ? categoryAndDescendantIds(categMap, selectedId) : []
        if (ids.length === 0) {
          return {
            items: [],
            page,
            pageSize,
            total: 0,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: page > 1,
          }
        }
        domain = andDomain(domain, ['categ_id', 'in', ids])
      }

      if (q) {
        domain = andDomain(domain, ['name', 'ilike', q])
      }

      const total = await odooExecuteKw<number>(
        ctx,
        'product.template',
        'search_count',
        [domain],
        { context: catalogContext() },
      )
      const rows = await odooExecuteKw<TemplateRow[]>(
        ctx,
        'product.template',
        'search_read',
        [domain],
        {
          fields: [...TEMPLATE_FIELDS],
          limit: pageSize,
          offset,
          context: catalogContext(),
        },
      )

      const categMap = await resolveCategorySlugMap(ctx)

      const items = rows.map((r) => {
        const categoryId = m2oId(r.categ_id)
        const catSlug = categoryId != null ? categorySlugById(categMap, categoryId) : null
        return templateToCard(r, catSlug)
      })
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
    },

    async getProductBySlug(ctx: OdooCallContext, slug: string) {
      const baseDomain = parseDomain(env.ODOO_PRODUCT_DOMAIN, [['sale_ok', '=', true]])
      const productId = idFromSlug(slug)

      let row: TemplateRow | undefined
      if (productId != null) {
        const rows = await odooExecuteKw<TemplateRow[]>(
          ctx,
          'product.template',
          'search_read',
          [['&', ...baseDomain, ['id', '=', productId]]],
          { fields: [...TEMPLATE_FIELDS], limit: 1, context: catalogContext() },
        )
        row = rows[0]
      }
      if (!row) {
        const byName = await odooExecuteKw<TemplateRow[]>(
          ctx,
          'product.template',
          'search_read',
          [['&', ...baseDomain, ['name', 'ilike', slug]]],
          { fields: [...TEMPLATE_FIELDS], limit: 1, context: catalogContext() },
        )
        row = byName[0]
      }
      if (!row) return null
      const categMap = await resolveCategorySlugMap(ctx)
      const variants = await resolveProductVariants(ctx, row)
      return mapProductDetail(row, categMap, variants)
    },

    async getRecommendedProducts(ctx: OdooCallContext, productSlugs: string[], options = {}) {
      const limit = options.limit ?? 8
      const productIds = productSlugs
        .map(idFromSlug)
        .filter((id): id is number => id != null)

      if (productIds.length === 0 || limit <= 0) return []

      const baseDomain = parseDomain(env.ODOO_PRODUCT_DOMAIN, [['sale_ok', '=', true]])

      if (options.strategy !== 'category') {
        const cartRowsFull = await odooExecuteKw<
          Array<{
            id: number
            categ_id: unknown
            optional_product_ids: number[]
            accessory_product_ids: number[]
          }>
        >(
          ctx,
          'product.template',
          'search_read',
          [[...baseDomain, ['id', 'in', productIds]]],
          {
            fields: ['id', 'categ_id', 'optional_product_ids', 'accessory_product_ids'],
            context: catalogContext(),
          },
        )

        const relatedIds = new Set<number>()
        for (const row of cartRowsFull) {
          for (const id of row.optional_product_ids ?? []) {
            if (!productIds.includes(id)) relatedIds.add(id)
          }
          for (const id of row.accessory_product_ids ?? []) {
            if (!productIds.includes(id)) relatedIds.add(id)
          }
        }

        if (relatedIds.size > 0) {
          const accessoryRows = await odooExecuteKw<TemplateRow[]>(
            ctx,
            'product.template',
            'search_read',
            [[...baseDomain, ['id', 'in', [...relatedIds]]]],
            {
              fields: [...TEMPLATE_FIELDS],
              limit,
              context: catalogContext(),
            },
          )
          if (accessoryRows.length > 0) {
            const categMap = await resolveCategorySlugMap(ctx)
            return accessoryRows.map((row) => {
              const categoryId = m2oId(row.categ_id)
              const categorySlug = categoryId != null ? categorySlugById(categMap, categoryId) : null
              return templateToCard(row, categorySlug)
            })
          }
        }
      }

      const cartRows = await odooExecuteKw<Pick<TemplateRow, 'id' | 'categ_id'>[]>(
        ctx,
        'product.template',
        'search_read',
        [[...baseDomain, ['id', 'in', productIds]]],
        { fields: ['id', 'categ_id'], context: catalogContext() },
      )
      const categoryIds = [
        ...new Set(
          cartRows
            .map((row) => m2oId(row.categ_id))
            .filter((id): id is number => id != null),
        ),
      ]

      const domain = [...baseDomain, ['id', 'not in', productIds]]
      if (categoryIds.length > 0) {
        domain.push(['categ_id', 'in', categoryIds])
      }

      const rows = await odooExecuteKw<TemplateRow[]>(
        ctx,
        'product.template',
        'search_read',
        [domain],
        {
          fields: [...TEMPLATE_FIELDS],
          limit,
          context: catalogContext(),
        },
      )
      const categMap = await resolveCategorySlugMap(ctx)

      return rows.map((row) => {
        const categoryId = m2oId(row.categ_id)
        const categorySlug = categoryId != null ? categorySlugById(categMap, categoryId) : null
        return templateToCard(row, categorySlug)
      })
    },
  }
}
