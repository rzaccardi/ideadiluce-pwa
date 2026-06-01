import { hubPrisma } from '@ideadiluce/hub-api'
import type { CategoryDTO, ProductListDTO } from '../../types/dto.js'
import { parseOdooTemplateId } from '../catalog/odooRef.js'
import { hubSnapshotForList, mapHubListCard, mapHubProduct } from './hub-catalog.mapper.js'
import type { HubProductDetailDTO } from './hub-catalog.types.js'

const productInclude = {
  seo: { include: { translations: { where: { locale: 'IT' as const }, take: 1 } } },
  categories: { include: { category: { select: { slug: true } } } },
  media: { orderBy: { sortOrder: 'asc' as const } },
  variants: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      attributes: { orderBy: { sortOrder: 'asc' as const } },
      media: { where: { kind: 'VARIANT' as const }, take: 1 },
    },
  },
} as const

export const hubCatalogRepository = {
  async findCategories(): Promise<CategoryDTO[]> {
    const rows = await hubPrisma.category.findMany({
      where: { isRoom: false },
      orderBy: [{ parentId: 'asc' }, { name: 'asc' }],
      select: { id: true, slug: true, name: true, parentId: true },
    })
    return rows.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      parentId: c.parentId,
    }))
  },

  async findProducts(options: {
    categorySlug?: string
    q?: string
    page: number
    pageSize: number
  }): Promise<{ list: ProductListDTO; snapshots: HubProductDetailDTO[] }> {
    const { categorySlug, q, page, pageSize } = options
    const where = {
      status: 'PUBLISHED' as const,
      visibility: 'PUBLIC' as const,
      ...(categorySlug
        ? { categories: { some: { category: { slug: categorySlug } } } }
        : {}),
      ...(q
        ? {
            OR: [
              { slug: { contains: q, mode: 'insensitive' as const } },
              { sku: { contains: q, mode: 'insensitive' as const } },
              { shortDescription: { contains: q, mode: 'insensitive' as const } },
              {
                seo: {
                  translations: {
                    some: {
                      OR: [
                        { metaTitle: { contains: q, mode: 'insensitive' as const } },
                        { metaDescription: { contains: q, mode: 'insensitive' as const } },
                        { focusKeyword: { contains: q, mode: 'insensitive' as const } },
                      ],
                    },
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [total, items] = await Promise.all([
      hubPrisma.product.count({ where }),
      hubPrisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ sortOrder: 'asc' }, { slug: 'asc' }],
        include: {
          ...productInclude,
          media: {
            where: { kind: { in: ['COVER', 'GALLERY'] } },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const snapshots = items.map((p) => hubSnapshotForList(p))
    const cards = items.map((p) => mapHubListCard(p))

    return {
      list: {
        items: cards,
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      snapshots,
    }
  },

  async findProductBySlug(slug: string): Promise<HubProductDetailDTO | null> {
    const p = await hubPrisma.product.findFirst({
      where: { slug, status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: productInclude,
    })
    return p ? mapHubProduct(p) : null
  },

  async findProductByOdooTemplateId(templateId: number): Promise<HubProductDetailDTO | null> {
    const p = await hubPrisma.product.findFirst({
      where: { odooTemplateId: templateId, status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: productInclude,
    })
    return p ? mapHubProduct(p) : null
  },

  async findProductByCartRef(productRef: string): Promise<HubProductDetailDTO | null> {
    const templateId = parseOdooTemplateId(productRef)
    if (templateId != null) {
      return this.findProductByOdooTemplateId(templateId)
    }
    return this.findProductBySlug(productRef)
  },

  async findSlugsByOdooTemplateIds(
    templateIds: number[],
  ): Promise<Map<number, { slug: string; name: string }>> {
    if (!templateIds.length) return new Map()
    const rows = await hubPrisma.product.findMany({
      where: { odooTemplateId: { in: templateIds } },
      select: {
        odooTemplateId: true,
        slug: true,
        seo: { include: { translations: { where: { locale: 'IT' }, take: 1 } } },
      },
    })
    const map = new Map<number, { slug: string; name: string }>()
    for (const row of rows) {
      if (row.odooTemplateId == null) continue
      const title = row.seo?.translations[0]?.metaTitle
      map.set(row.odooTemplateId, {
        slug: row.slug,
        name: title?.replace(/\s*-\s*IdeaDiLuce.*$/i, '').trim() || row.slug,
      })
    }
    return map
  },

  async hasCatalog(): Promise<boolean> {
    const n = await hubPrisma.product.count({ where: { status: 'PUBLISHED' } })
    return n > 0
  },
}
