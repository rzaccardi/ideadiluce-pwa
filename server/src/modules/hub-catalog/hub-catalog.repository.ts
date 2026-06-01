import { hubPrisma } from '@ideadiluce/hub-api'
import type {
  CategoryDTO,
  ProductCardDTO,
  ProductDetailDTO,
  ProductListDTO,
  ProductVariantAttributeDTO,
  ProductVariantDTO,
} from '../../types/dto.js'

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function productName(
  seo: { translations: { metaTitle: string | null }[] } | null,
  slug: string,
): string {
  const title = seo?.translations[0]?.metaTitle
  if (title && !title.includes('%%')) {
    return title.replace(/\s*-\s*IdeaDiLuce.*$/i, '').trim() || humanizeSlug(slug)
  }
  return humanizeSlug(slug)
}

function productImages(
  media: { url: string; kind: string; sortOrder: number }[],
  fallback: string | null,
): string[] {
  const ordered = [...media]
    .filter((m) => m.kind === 'COVER' || m.kind === 'GALLERY')
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const urls = ordered.map((m) => m.url)
  if (!urls.length && fallback) return [fallback]
  return urls
}

function variantLabel(
  attrs: ProductVariantAttributeDTO[],
  sku: string | null,
  slug: string,
): string {
  if (attrs.length) {
    return attrs.map((a) => `${a.name}: ${a.value}`).join(' · ')
  }
  if (sku) return sku.split('|').map((s) => s.trim())[0] ?? sku
  return humanizeSlug(slug)
}

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
  }): Promise<ProductListDTO> {
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
          seo: { include: { translations: { where: { locale: 'IT' }, take: 1 } } },
          categories: {
            take: 1,
            include: { category: { select: { slug: true } } },
          },
          media: {
            where: { kind: { in: ['COVER', 'GALLERY'] } },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const cards: ProductCardDTO[] = items.map((p) => {
      const cover = p.media[0]?.url ?? p.ogImageUrl
      return {
        slug: p.slug,
        name: productName(p.seo, p.slug),
        shortDescription:
          p.shortDescription?.slice(0, 200) ??
          p.seo?.translations[0]?.metaDescription?.slice(0, 200) ??
          null,
        priceCents: 0,
        currency: 'EUR',
        imageUrl: cover,
        categorySlug: p.categories[0]?.category.slug ?? null,
      }
    })

    return {
      items: cards,
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    }
  },

  async findProductBySlug(slug: string): Promise<ProductDetailDTO | null> {
    const p = await hubPrisma.product.findFirst({
      where: { slug, status: 'PUBLISHED', visibility: 'PUBLIC' },
      include: {
        seo: { include: { translations: { where: { locale: 'IT' }, take: 1 } } },
        categories: { include: { category: { select: { slug: true } } } },
        media: { orderBy: { sortOrder: 'asc' } },
        variants: {
          orderBy: { sortOrder: 'asc' },
          include: {
            attributes: { orderBy: { sortOrder: 'asc' } },
            media: { where: { kind: 'VARIANT' }, take: 1 },
          },
        },
      },
    })
    if (!p) return null

    const tr = p.seo?.translations[0]
    const images = productImages(p.media, p.ogImageUrl)
    const cover = images[0] ?? p.ogImageUrl

    const variants: ProductVariantDTO[] = p.variants.map((v) => {
      const attrs: ProductVariantAttributeDTO[] = v.attributes.map((a) => ({
        name: a.name,
        value: a.value,
      }))
      return {
        ref: String(v.wooPostId),
        label: variantLabel(attrs, v.sku, v.slug),
        imageUrl: v.media[0]?.url ?? null,
        attributes: attrs,
      }
    })

    return {
      slug: p.slug,
      name: productName(p.seo, p.slug),
      shortDescription:
        p.shortDescription?.slice(0, 200) ?? tr?.metaDescription?.slice(0, 200) ?? null,
      longDescription: p.longDescription ?? tr?.metaDescription ?? null,
      priceCents: 0,
      currency: 'EUR',
      imageUrl: cover,
      images,
      categorySlug: p.categories[0]?.category.slug ?? null,
      sku: p.sku,
      inStock: p.purchasable,
      variants,
    }
  },

  async hasCatalog(): Promise<boolean> {
    const n = await hubPrisma.product.count({ where: { status: 'PUBLISHED' } })
    return n > 0
  },
}
