import { env } from '../../config/env.js'

export const ODOO_CATALOG_IMAGE_SIZES = [
  'image_128',
  'image_256',
  'image_512',
  'image_1024',
  'image_1920',
] as const

export type OdooCatalogImageSize = (typeof ODOO_CATALOG_IMAGE_SIZES)[number]

const SIZE_RE = /\/(image_128|image_256|image_512|image_1024|image_1920)(?:\b|$)/
const DEFAULT_MEDIA_BASE = 'https://tlbdb.odoo.com'

function mediaBase(): string {
  return env.ODOO_CATALOG_BASE_URL?.trim().replace(/\/$/, '') || DEFAULT_MEDIA_BASE
}

export function resolveOdooCatalogMediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = mediaBase()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Sostituisce la size nell'URL Odoo `/web/image/.../image_N`. */
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

/** URL pubblico stabile documenti: `/product-docs/<ced>/<tipo>/current`. */
export function odooCatalogProductDocCurrentUrl(ced: string, type: string): string {
  return `${mediaBase()}/product-docs/${encodeURIComponent(ced)}/${encodeURIComponent(type)}/current`
}
