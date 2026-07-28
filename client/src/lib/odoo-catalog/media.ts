import { getOdooCatalogMediaBaseUrl } from '@/lib/env'

const DEFAULT_MEDIA_BASE = 'https://tlbdb.odoo.com'

export const ODOO_CATALOG_IMAGE_SIZES = [
  'image_128',
  'image_256',
  'image_512',
  'image_1024',
  'image_1920',
] as const

export type OdooCatalogImageSize = (typeof ODOO_CATALOG_IMAGE_SIZES)[number]

const SIZE_RE = /\/(image_128|image_256|image_512|image_1024|image_1920)(?:\b|$)/

export function resolveOdooCatalogMediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = getOdooCatalogMediaBaseUrl()?.replace(/\/$/, '') ?? DEFAULT_MEDIA_BASE
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Sostituisce la size nell'URL Odoo `/web/image/.../image_N` (proporzioni preservate, no crop). */
export function withOdooCatalogImageSize(
  url: string | null | undefined,
  size: OdooCatalogImageSize,
): string | null {
  if (!url?.trim()) return null
  if (SIZE_RE.test(url)) return url.replace(SIZE_RE, `/${size}`)
  return url
}

export function resolveOdooCatalogMediaUrlWithSize(
  path: string | null | undefined,
  size: OdooCatalogImageSize,
): string | null {
  return withOdooCatalogImageSize(resolveOdooCatalogMediaUrl(path), size)
}

/** Confronta URL Odoo ignorando la size (`image_512` vs `image_1920`). */
export function odooCatalogImageUrlsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  if (!a?.trim() || !b?.trim()) return false
  if (a === b) return true
  const norm = (url: string) => url.replace(SIZE_RE, '/image_SIZE')
  return norm(a) === norm(b)
}

/** URL pubblico stabile documenti prodotto (senza auth, 302 sull'ultima versione). */
export function odooCatalogProductDocCurrentUrl(
  ced: string,
  type: string,
  baseUrl?: string | null,
): string {
  const base = (baseUrl ?? getOdooCatalogMediaBaseUrl() ?? DEFAULT_MEDIA_BASE).replace(/\/$/, '')
  return `${base}/product-docs/${encodeURIComponent(ced)}/${encodeURIComponent(type)}/current`
}
