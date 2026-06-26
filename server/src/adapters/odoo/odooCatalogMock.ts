import type { ProductCardDTO, ProductDetailDTO } from '../../types/dto.js'
import { defaultProductAlternates, defaultProductSeo } from '../../lib/product-seo-defaults.js'
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '../../modules/catalog/catalog.mock.js'
import type { OdooCatalogAdapter } from './odooCatalogAdapter.js'
import type { OdooCallContext } from './odooClient.js'

function categoryAndDescendantSlugs(categorySlug: string): Set<string> {
  const slugs = new Set<string>([categorySlug])
  const slugById = new Map(MOCK_CATEGORIES.map((category) => [category.id, category.slug]))
  let changed = true

  while (changed) {
    changed = false
    for (const category of MOCK_CATEGORIES) {
      const parent = category.parentId != null ? slugById.get(category.parentId) : null
      if (parent != null && slugs.has(parent) && !slugs.has(category.slug)) {
        slugs.add(category.slug)
        changed = true
      }
    }
  }

  return slugs
}

function paginate<T>(items: T[], page = 1, pageSize = 24) {
  const start = (page - 1) * pageSize
  const pagedItems = items.slice(start, start + pageSize)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  return {
    items: pagedItems,
    page,
    pageSize,
    total: items.length,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

function productToCard(p: (typeof MOCK_PRODUCTS)[number]): ProductCardDTO {
  return {
    slug: p.slug,
    locale: 'IT',
    name: p.name,
    shortDescription: p.shortDescription,
    priceCents: p.priceCents,
    priceDisplayMode: 'ex_vat',
    currency: p.currency,
    imageUrl: p.imageUrl,
    categorySlug: p.categorySlug,
    inStock: p.inStock,
  }
}

export function createMockOdooCatalogAdapter(): OdooCatalogAdapter {
  return {
    async getCategories(_ctx: OdooCallContext) {
      return MOCK_CATEGORIES
    },
    async getProducts(_ctx: OdooCallContext, filter, pagination) {
      let list = MOCK_PRODUCTS
      if (filter?.categorySlug) {
        const categorySlugs = categoryAndDescendantSlugs(filter.categorySlug)
        list = list.filter((p) => p.categorySlug != null && categorySlugs.has(p.categorySlug))
      }
      if (filter?.q) {
        const q = filter.q.toLowerCase()
        list = list.filter((p) =>
          [p.name, p.shortDescription, p.longDescription]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(q)),
        )
      }
      const items = list.map(productToCard)
      return paginate(items, pagination?.page, pagination?.pageSize)
    },
    async getProductBySlug(_ctx: OdooCallContext, slug: string) {
      const p = MOCK_PRODUCTS.find((x) => x.slug === slug)
      if (!p) return null
      const d: ProductDetailDTO = {
        slug: p.slug,
        locale: 'IT',
        name: p.name,
        shortDescription: p.shortDescription,
        longDescription: p.longDescription,
        additionalInfoTableHtml: null,
        specsTableHtml: null,
        priceCents: p.priceCents,
        priceDisplayMode: 'ex_vat',
        currency: p.currency,
        imageUrl: p.imageUrl,
        images: p.imageUrl ? [p.imageUrl] : [],
        odooTemplateId: null,
        categorySlug: p.categorySlug,
        categories: p.categorySlug
          ? [{ slug: p.categorySlug, name: p.categorySlug }]
          : [],
        brand: null,
        sku: p.sku,
        inStock: p.inStock,
        variants: p.variants.map((v) => ({
          ...v,
          priceCents: p.priceCents,
          inStock: p.inStock,
        })),
        seo: defaultProductSeo(p.name, p.slug, p.shortDescription),
        alternates: defaultProductAlternates(p.slug),
      }
      return d
    },
    async getRecommendedProducts(_ctx: OdooCallContext, productSlugs: string[], options) {
      const limit = options?.limit ?? 6
      const cartSlugs = new Set(productSlugs)
      const cartCategories = new Set(
        MOCK_PRODUCTS.filter((p) => cartSlugs.has(p.slug))
          .map((p) => p.categorySlug)
          .filter((categorySlug): categorySlug is string => categorySlug != null),
      )

      const sameCategory = MOCK_PRODUCTS.filter(
        (p) => !cartSlugs.has(p.slug) && p.categorySlug != null && cartCategories.has(p.categorySlug),
      )
      const fallback = MOCK_PRODUCTS.filter((p) => !cartSlugs.has(p.slug) && !sameCategory.includes(p))

      return [...sameCategory, ...fallback].slice(0, limit).map(productToCard)
    },
  }
}
