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
  isLoading: false,
  isRefreshing: false,
  error: null as string | null,
})

export async function fetchSeoStatus() {
  seoStore.isLoading = true
  seoStore.error = null
  try {
    const [status, redirects] = await Promise.all([
      adminApi<SeoStatus>('/admin/seo/status'),
      adminApi<{ items: SeoRedirect[] }>('/admin/seo/redirects'),
    ])
    seoStore.status = status
    seoStore.redirects = redirects.items
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
    await fetchSeoStatus()
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
  await fetchSeoStatus()
}

export async function deleteSeoRedirect(fromPath: string) {
  const q = new URLSearchParams({ path: fromPath })
  await adminApi(`/admin/seo/redirects?${q}`, { method: 'DELETE' })
  await fetchSeoStatus()
}
