import { adminApi, adminApiFormData } from '@/lib/api'
import { dedupeAsync } from '@/lib/async-cache'
import type { AdminBrandRow } from '@/types/brands'
import { brandsStore } from './brands.store'

function errMessage(e: unknown) {
  return String(e)
}

async function loadBrands() {
  brandsStore.isLoading = true
  brandsStore.error = null
  try {
    brandsStore.items = await adminApi<AdminBrandRow[]>('/admin/brands')
  } catch (e) {
    brandsStore.error = errMessage(e)
    brandsStore.items = []
  } finally {
    brandsStore.isLoading = false
  }
}

export function fetchBrands() {
  return dedupeAsync('admin:brands', loadBrands)
}

export async function refreshBrands() {
  return loadBrands()
}

/** Nome e conteggi restano quelli della lista: la risposta non richiama Odoo. */
function applyLogoRow(current: AdminBrandRow, next: AdminBrandRow): AdminBrandRow {
  return {
    ...current,
    logoLightUrl: next.logoLightUrl,
    logoDarkUrl: next.logoDarkUrl,
    logoLightSource: next.logoLightSource,
    hasLogos: next.hasLogos,
    updatedAt: next.updatedAt,
  }
}

export async function uploadBrandLogo(slug: string, variant: 'light' | 'dark', file: File) {
  brandsStore.busySlug = slug
  brandsStore.error = null
  try {
    const form = new FormData()
    form.set('variant', variant)
    form.set('file', file)
    const row = await adminApiFormData<AdminBrandRow>(
      `/admin/brands/${encodeURIComponent(slug)}/logo`,
      form,
    )
    brandsStore.items = brandsStore.items.map((item) =>
      item.slug === slug ? applyLogoRow(item, row) : item,
    )
  } catch (e) {
    brandsStore.error = errMessage(e)
    throw e
  } finally {
    brandsStore.busySlug = null
  }
}

export async function deleteBrandLogo(slug: string, variant: 'light' | 'dark') {
  brandsStore.busySlug = slug
  brandsStore.error = null
  try {
    const row = await adminApi<AdminBrandRow>(
      `/admin/brands/${encodeURIComponent(slug)}/logo/${variant}`,
      { method: 'DELETE' },
    )
    brandsStore.items = brandsStore.items.map((item) =>
      item.slug === slug ? applyLogoRow(item, row) : item,
    )
  } catch (e) {
    brandsStore.error = errMessage(e)
    throw e
  } finally {
    brandsStore.busySlug = null
  }
}

export async function seedStaticBrandLogos() {
  brandsStore.error = null
  try {
    const result = await adminApi<{ upserted: number; stems: string[] }>(
      '/admin/brands/seed-static-logos',
      { method: 'POST' },
    )
    await loadBrands()
    return result
  } catch (e) {
    brandsStore.error = errMessage(e)
    throw e
  }
}

export async function clearBrandLogos(slug: string) {
  brandsStore.busySlug = slug
  brandsStore.error = null
  try {
    const row = await adminApi<AdminBrandRow>(`/admin/brands/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    })
    brandsStore.items = brandsStore.items.map((item) =>
      item.slug === slug ? applyLogoRow(item, row) : item,
    )
  } catch (e) {
    brandsStore.error = errMessage(e)
    throw e
  } finally {
    brandsStore.busySlug = null
  }
}
