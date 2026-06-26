import { cache } from 'react'
import { serverApiClient } from '@/api/server'
import { toArflyLang } from '@/lib/arfly/locale'
import { mapArflyListResponse, mapArflyProductDetail } from '@/lib/arfly/mapper'
import type { PwaLocale } from '@/lib/locale'
import type { ProductCardDTO, ProductDetailDTO } from '@/types/dto'
import type { ArflyProductDetailResponse, ArflyProductListResponse } from '@/lib/arfly/types'

export async function fetchFeaturedProducts(locale: PwaLocale, pageSize = 3): Promise<ProductCardDTO[]> {
  const search = new URLSearchParams({ lang: toArflyLang(locale), page: '1', per_page: String(pageSize) })
  const raw = await serverApiClient.get<ArflyProductListResponse>(`/api/v2/products?${search}`)
  return mapArflyListResponse(raw, locale).items
}

/**
 * PDP SSR: stessa pipeline del CSR (by-slug → map → enrich-detail).
 * Cookie sessione inoltrati → proxy Arfly applica listino da sessione se assente in query.
 */
async function findProductIdBySlugServer(slug: string, locale: PwaLocale): Promise<number | null> {
  const lang = toArflyLang(locale)
  let page = 1
  while (page <= 20) {
    const search = new URLSearchParams({ lang, page: String(page), per_page: '100' })
    const list = await serverApiClient.get<ArflyProductListResponse>(`/api/v2/products?${search}`)
    const hit = list.items.find((item) => item.slug === slug)
    if (hit) return hit.id
    if (page >= list.total_pages) break
    page += 1
  }
  return null
}

export const fetchProductDetailServer = cache(async function fetchProductDetailServer(
  slug: string,
  locale: PwaLocale,
): Promise<{ product: ProductDetailDTO; relatedProducts: ProductCardDTO[] } | null> {
  const lang = toArflyLang(locale)
  const bySlugSearch = new URLSearchParams({ lang, slug })

  let res: ArflyProductDetailResponse | null = null
  try {
    res = await serverApiClient.get<ArflyProductDetailResponse>(
      `/api/v2/product/by-slug?${bySlugSearch}`,
    )
  } catch {
    // by-slug non disponibile su Odoo: fallback slug → id (come CSR)
  }

  if (!res?.product) {
    const productId = await findProductIdBySlugServer(slug, locale)
    if (productId == null) return null
    try {
      const detailSearch = new URLSearchParams({ lang })
      res = await serverApiClient.get<ArflyProductDetailResponse>(
        `/api/v2/product/${productId}?${detailSearch}`,
      )
    } catch {
      return null
    }
  }

  if (!res?.product) return null

  let product = mapArflyProductDetail(res.product, locale)
  try {
    product = await serverApiClient.post<ProductDetailDTO>(
      '/api/v1/catalog/availability/enrich-detail',
      product,
    )
  } catch {
    // SSR: mantieni dati Arfly se arricchimento non disponibile
  }

  const relatedFromOdoo = product.relatedProducts ?? []
  let relatedProducts: ProductCardDTO[] = relatedFromOdoo.slice(0, 4)

  if (relatedProducts.length === 0) {
    const listSearch = new URLSearchParams({ lang, page: '1', per_page: '5' })
    const list = await serverApiClient.get<ArflyProductListResponse>(`/api/v2/products?${listSearch}`)
    relatedProducts = mapArflyListResponse(list, locale).items
      .filter((item) => item.slug !== slug)
      .slice(0, 4)
  }

  return { product, relatedProducts }
})

export async function fetchCatalogProductsServer(
  locale: PwaLocale,
  params: { page?: number; pageSize?: number; q?: string; category?: string; brand?: string } = {},
): Promise<ReturnType<typeof mapArflyListResponse>> {
  const search = new URLSearchParams({ lang: toArflyLang(locale) })
  search.set('page', String(params.page ?? 1))
  search.set('per_page', String(params.pageSize ?? 24))
  if (params.q) search.set('q', params.q)
  if (params.category) search.set('category', params.category)
  if (params.brand) search.set('brand', params.brand)
  const raw = await serverApiClient.get<ArflyProductListResponse>(`/api/v2/products?${search}`)
  return mapArflyListResponse(raw, locale)
}

export async function fetchCategoryMetaServer(slug: string, locale: PwaLocale) {
  const search = new URLSearchParams({ locale })
  const res = await serverApiClient.get<{ items: import('@/types/dto').CategoryDTO[] }>(
    `/api/v1/catalog/categories?${search}`,
  )
  return res.items.find((c) => c.slug === slug) ?? null
}

export async function fetchBrandMetaServer(slug: string, locale: PwaLocale) {
  const search = new URLSearchParams({ locale })
  const res = await serverApiClient.get<{ items: import('@/types/site-content').BrandListItemDTO[] }>(
    `/api/v1/catalog/brands?${search}`,
  )
  return res.items.find((b) => b.slug === slug) ?? null
}
