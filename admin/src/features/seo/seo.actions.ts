import { proxy } from 'valtio'
import { adminApi } from '@/lib/api'

export type SeoRedirect = {
  id: string
  fromPath: string
  toPath: string
  statusCode: number
  reason: string | null
  createdAt: string
  updatedAt: string
}

export type SeoStatus = {
  sitemap: { builtAt: string; urlCount: number | null } | null
  merchantFeed: { builtAt: string; itemCount: number | null } | null
  llms: { builtAt: string } | null
  refreshRunning: boolean
  publicUrls: {
    sitemap: string
    merchantFeed: string
    llms: string
  }
}

export type MerchantCenterSettings = {
  enabled: boolean
  includeOutOfStock: boolean
  expandVariants: boolean
  googleProductCategory: string
  shippingCountry: string
  shippingPriceCents: number | null
  brandFallback: string
  publicFeedUrl: string
  lastBuiltAt: string | null
  itemCount: number | null
}

export type MerchantFeedIssue =
  | 'missing_image'
  | 'missing_gtin'
  | 'zero_price'
  | 'missing_title'
  | 'noindex'

export type MerchantFeedSampleRow = {
  slug: string
  id: string
  title: string
  feedPrice: string
  availability: 'in_stock' | 'out_of_stock' | 'backorder'
  gtin: string | null
  included: boolean
  issues: MerchantFeedIssue[]
}

export const seoStore = proxy({
  status: null as SeoStatus | null,
  merchant: null as MerchantCenterSettings | null,
  merchantSample: [] as MerchantFeedSampleRow[],
  redirects: [] as SeoRedirect[],
  redirectsList: null as {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNextPage: boolean
  } | null,
  redirectsLoading: false,
  redirectsLoadingMore: false,
  isLoading: false,
  isRefreshing: false,
  isSavingMerchant: false,
  isValidatingMerchant: false,
  error: null as string | null,
})

type RedirectsListResponse = {
  items: SeoRedirect[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export async function fetchSeoRedirectsList(query: string, options?: { append?: boolean }) {
  if (options?.append) seoStore.redirectsLoadingMore = true
  else seoStore.redirectsLoading = true
  try {
    const data = await adminApi<RedirectsListResponse>(`/admin/seo/redirects?${query}`)
    seoStore.redirectsList = data
    seoStore.redirects = options?.append ? [...seoStore.redirects, ...data.items] : data.items
  } catch (e) {
    seoStore.error = e instanceof Error ? e.message : 'Errore caricamento redirect'
    if (!options?.append) seoStore.redirects = []
  } finally {
    seoStore.redirectsLoading = false
    seoStore.redirectsLoadingMore = false
  }
}

export async function fetchSeoStatus() {
  seoStore.error = null
  seoStore.status = await adminApi<SeoStatus>('/admin/seo/status')
}

export async function fetchSeoAdminData(redirectsQuery = 'page=1&pageSize=50') {
  seoStore.isLoading = true
  seoStore.error = null
  try {
    const [statusResult, merchantResult] = await Promise.allSettled([
      adminApi<SeoStatus>('/admin/seo/status'),
      adminApi<MerchantCenterSettings>('/admin/seo/merchant-center'),
    ])
    if (statusResult.status === 'fulfilled') seoStore.status = statusResult.value
    else seoStore.error = statusResult.reason instanceof Error ? statusResult.reason.message : 'Errore caricamento SEO'
    if (merchantResult.status === 'fulfilled') seoStore.merchant = merchantResult.value
    else if (!seoStore.error) {
      seoStore.error =
        merchantResult.reason instanceof Error
          ? merchantResult.reason.message
          : 'Errore caricamento Merchant Center'
    }
    await fetchSeoRedirectsList(redirectsQuery)
  } catch (e) {
    seoStore.error = e instanceof Error ? e.message : 'Errore caricamento SEO'
  } finally {
    seoStore.isLoading = false
  }
}

export async function refreshSeoCaches() {
  seoStore.isRefreshing = true
  seoStore.error = null
  try {
    await adminApi('/admin/seo/refresh', { method: 'POST' })
    await fetchSeoAdminData()
  } finally {
    seoStore.isRefreshing = false
  }
}

export async function saveMerchantCenterSettings(
  patch: Partial<
    Pick<
      MerchantCenterSettings,
      | 'enabled'
      | 'includeOutOfStock'
      | 'expandVariants'
      | 'googleProductCategory'
      | 'shippingCountry'
      | 'shippingPriceCents'
      | 'brandFallback'
    >
  >,
) {
  seoStore.isSavingMerchant = true
  seoStore.error = null
  try {
    seoStore.merchant = await adminApi<MerchantCenterSettings>('/admin/seo/merchant-center', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    await fetchSeoStatus()
  } catch (e) {
    seoStore.error = e instanceof Error ? e.message : 'Salvataggio Merchant Center fallito'
    throw e
  } finally {
    seoStore.isSavingMerchant = false
  }
}

export async function validateMerchantFeedSample() {
  seoStore.isValidatingMerchant = true
  seoStore.error = null
  try {
    const sample = await adminApi<{ enabled: boolean; items: MerchantFeedSampleRow[] }>(
      '/admin/seo/merchant-feed/validate',
    )
    seoStore.merchantSample = sample.items
  } catch (e) {
    seoStore.error = e instanceof Error ? e.message : 'Controllo feed fallito'
    throw e
  } finally {
    seoStore.isValidatingMerchant = false
  }
}

export async function upsertSeoRedirect(input: {
  fromPath: string
  toPath: string
  statusCode?: number
  reason?: string | null
}) {
  await adminApi('/admin/seo/redirects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  await fetchSeoRedirectsList('page=1&pageSize=50')
}

export async function deleteSeoRedirect(fromPath: string) {
  const q = new URLSearchParams({ path: fromPath })
  await adminApi(`/admin/seo/redirects?${q}`, { method: 'DELETE' })
  await fetchSeoRedirectsList('page=1&pageSize=50')
}
