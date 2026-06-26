import { getArflyMediaBaseUrl } from '@/lib/env'

const DEFAULT_MEDIA_BASE = 'https://tlbdb.odoo.com'

export function resolveArflyMediaUrl(path: string | null | undefined): string | null {
  if (!path?.trim()) return null
  if (/^https?:\/\//i.test(path)) return path
  const base = getArflyMediaBaseUrl()?.replace(/\/$/, '') ?? DEFAULT_MEDIA_BASE
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
