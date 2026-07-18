import { cache } from 'react'
import { serverApiClient } from '@/api/server'
import { toArflyLang } from '@/lib/arfly/locale'
import { mapArflyListResponse, mapArflyProductDetail } from '@/lib/arfly/mapper'
import type { PwaLocale } from '@/lib/locale'
import type { ProductCardDTO, ProductDetailDTO, ProductListDTO } from '@/types/dto'
import type { ArflyProductDetailResponse, ArflyProductListResponse } from '@/lib/arfly/types'
import type { HomeProductSliderDTO } from '@/types/home-product-sliders'
import type { CatalogPageContent } from '@/types/site-content'
import type { CategoryDTO } from '@/types/dto'
import type { BrandListItemDTO } from '@/types/site-content'

export type CatalogBootstrapServerData = {
  categories: CategoryDTO[]
  brands: BrandListItemDTO[]
  cms: CatalogPageContent | null
}

export const fetchHomeProductSlidersServer = cache(async function fetchHomeProductSlidersServer(
  locale: PwaLocale,
): Promise<HomeProductSliderDTO[]> {
  try {
    const search = new URLSearchParams({ locale })
    return await serverApiClient.get<HomeProductSliderDTO[]>(
      `/api/v1/catalog/home/product-sliders?${search.toString()}`,
    )
  } catch {
    return []
  }
})

export type HomeFeaturedGuideDTO = {
  slug: string
  category: string
  meta: string
  title: string
  href: string
  featured: boolean
  sortOrder: number
}

export const fetchCatalogBootstrapServer = cache(async function fetchCatalogBootstrapServer(
  locale: PwaLocale,
): Promise<CatalogBootstrapServerData> {
  try {
    const search = new URLSearchParams({ locale })
    return await serverApiClient.get<CatalogBootstrapServerData>(
      `/api/v1/catalog/bootstrap?${search.toString()}`,
    )
  } catch {
    return { categories: [], brands: [], cms: null }
  }
})

export const fetchHomeBrandsServer = cache(async function fetchHomeBrandsServer(locale: PwaLocale) {
  try {
    const search = new URLSearchParams({ locale })
    const res = await serverApiClient.get<{ items: import('@/types/site-content').BrandListItemDTO[] }>(
      `/api/v1/catalog/brands?${search.toString()}`,
    )
    return res.items ?? []
  } catch {
    return []
  }
})

export const fetchFeaturedGuidesServer = cache(async function fetchFeaturedGuidesServer(locale: PwaLocale) {
  try {
    const search = new URLSearchParams({ locale, featured: 'true' })
    return await serverApiClient.get<HomeFeaturedGuideDTO[]>(
      `/api/v1/site/guides?${search.toString()}`,
    )
  } catch {
    return []
  }
})

export async function fetchFeaturedProducts(locale: PwaLocale, pageSize = 3): Promise<ProductCardDTO[]> {
  const search = new URLSearchParams({ lang: toArflyLang(locale), page: '1', per_page: String(pageSize) })
  const raw = await serverApiClient.get<ArflyProductListResponse>(`/api/v2/products?${search}`)
  return mapArflyListResponse(raw, locale).items
}

/** Related SSR: solo quelli già sul prodotto — evita un secondo round-trip catalogo sul TTFB. */
function loadRelatedProducts(
  relatedFromProduct: ProductCardDTO[],
): ProductCardDTO[] {
  return relatedFromProduct.slice(0, 4)
}

/**
 * PDP SSR: by-slug (con fallback slug→id nel BFF) → map DTO.
 * L'arricchimento stock/prezzi Odoo avviene lato client per non bloccare il TTFB.
 */
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
    return null
  }

  if (!res?.product) return null

  const product = mapArflyProductDetail(res.product, locale)
  const relatedProducts = loadRelatedProducts(product.relatedProducts ?? [])

  return { product, relatedProducts }
})

export async function fetchCatalogProductsServer(
  locale: PwaLocale,
  params: {
    page?: number
    pageSize?: number
    q?: string
    category?: string
    brand?: string
    attacco?: string
    colorTemp?: string
  } = {},
): Promise<ProductListDTO> {
  return fetchCatalogProductsServerCached(
    locale,
    params.page ?? 1,
    params.pageSize ?? 24,
    params.q ?? '',
    params.category ?? '',
    params.brand ?? '',
    params.attacco ?? '',
    params.colorTemp ?? '',
  )
}

const fetchCatalogProductsServerCached = cache(
  async function fetchCatalogProductsServerCached(
    locale: PwaLocale,
    page: number,
    pageSize: number,
    q: string,
    category: string,
    brand: string,
    attacco: string,
    colorTemp: string,
  ): Promise<ProductListDTO> {
    const search = new URLSearchParams({ locale })
    search.set('page', String(page))
    search.set('pageSize', String(pageSize))
    if (q) search.set('q', q)
    if (category) search.set('category', category)
    if (brand) search.set('brand', brand)
    if (attacco) search.set('attacco', attacco)
    if (colorTemp) search.set('colorTemp', colorTemp)
    return serverApiClient.get<ProductListDTO>(`/api/v1/catalog/products?${search}`)
  },
)

export async function fetchCategoryMetaServer(slug: string, locale: PwaLocale) {
  const search = new URLSearchParams({ locale })
  const res = await serverApiClient.get<{ item: import('@/types/dto').CategoryDTO | null }>(
    `/api/v1/catalog/categories/${encodeURIComponent(slug)}?${search}`,
  )
  return res.item
}

export async function fetchBrandMetaServer(slug: string, locale: PwaLocale) {
  const search = new URLSearchParams({ locale })
  const res = await serverApiClient.get<{ item: import('@/types/site-content').BrandListItemDTO | null }>(
    `/api/v1/catalog/brands/${encodeURIComponent(slug)}?${search}`,
  )
  return res.item
}
