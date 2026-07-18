import { env } from './env.js'

export type SiteTenantId = 'design' | 'technical'

export type SiteTenantConfig = {
  id: SiteTenantId
  host: string
  publicUrl: string
  arflyWebsiteId: number
  catalogRootCategorySlug: string
}

function normalizePublicUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

function hostFromUrl(url: string): string {
  return new URL(normalizePublicUrl(url)).host
}

/** Tenant arredo/design — ideadiluce.com (Fase 1 go-live). */
export function getDesignTenant(): SiteTenantConfig {
  const publicUrl = normalizePublicUrl(env.PUBLIC_SITE_URL)
  return {
    id: 'design',
    host: hostFromUrl(publicUrl),
    publicUrl,
    arflyWebsiteId: env.ARFLY_WEBSITE_ID,
    catalogRootCategorySlug: 'arredo',
  }
}

/** Tenant tecnico — attivo solo quando TECHNICAL_SITE_URL è configurato (Fase 2). */
export function getTechnicalTenant(): SiteTenantConfig | null {
  const raw = env.TECHNICAL_SITE_URL?.trim()
  if (!raw) return null

  const publicUrl = normalizePublicUrl(raw)
  const websiteId = env.TECHNICAL_ARFLY_WEBSITE_ID ?? env.ARFLY_WEBSITE_ID

  return {
    id: 'technical',
    host: hostFromUrl(publicUrl),
    publicUrl,
    arflyWebsiteId: websiteId,
    catalogRootCategorySlug: 'illuminazione-tecnica',
  }
}

export function resolveTenantByHost(host: string): SiteTenantConfig | null {
  const normalized = host.toLowerCase()
  const design = getDesignTenant()
  if (design.host.toLowerCase() === normalized) return design

  const technical = getTechnicalTenant()
  if (technical && technical.host.toLowerCase() === normalized) return technical

  return null
}

/** Redirect 301 cross-domain per prodotti tecnici (Fase 2). */
export function buildTechnicalProductRedirectUrl(productSlug: string): string | null {
  const technical = getTechnicalTenant()
  if (!technical) return null
  return `${technical.publicUrl}/prodotto/${encodeURIComponent(productSlug)}`
}
