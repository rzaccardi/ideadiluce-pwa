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

export const seoStore = proxy({
  status: null as SeoStatus | null,
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
    await Promise.all([
      adminApi<SeoStatus>('/admin/seo/status').then((status) => {
        seoStore.status = status
      }),
      fetchSeoRedirectsList(redirectsQuery),
    ])
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
