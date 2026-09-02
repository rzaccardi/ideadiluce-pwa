export const UPTIME_FRIENDLY_PREFIX = 'IDL · '

export type UptimeRecommendedType = 'http' | 'keyword'

export type RecommendedMonitorSpec = {
  key: string
  friendlyName: string
  url: string
  type: UptimeRecommendedType
  /** Per type=keyword: stringa che deve comparire nella risposta. */
  keywordValue?: string
  description: string
}

export type UptimeRecommendedEnv = {
  publicSiteUrl: string
  adminOrigin: string
  odooBaseUrl?: string
  apiPublicUrl?: string
}

function isPublicHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false
    if (host.endsWith('.local') || host.endsWith('.internal')) return false
    return true
  } catch {
    return false
  }
}

function trimSlash(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

/** Normalizza URL per confrontare monitor UptimeRobot con quelli consigliati. */
export function normalizeMonitorUrl(url: string): string {
  const raw = url.trim()
  if (!raw) return ''
  try {
    const parsed = new URL(raw)
    parsed.hash = ''
    parsed.hostname = parsed.hostname.toLowerCase()
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = ''
    }
    const path = parsed.pathname.replace(/\/+$/, '') || '/'
    return `${parsed.protocol}//${parsed.host}${path}${parsed.search}`
  } catch {
    return trimSlash(raw).toLowerCase()
  }
}

export function recommendedFriendlyName(label: string): string {
  return `${UPTIME_FRIENDLY_PREFIX}${label}`
}

/**
 * Monitor che ha senso tenere su UptimeRobot per shop, API, catalogo, Odoo e BO.
 * Gli URL pubblici passano dal dominio shop (rewrite `/api`) così i check coincidono col traffico utente.
 */
export function buildRecommendedMonitors(env: UptimeRecommendedEnv): RecommendedMonitorSpec[] {
  const site = trimSlash(env.publicSiteUrl || '')
  const admin = trimSlash(env.adminOrigin || '')
  const odoo = trimSlash(env.odooBaseUrl || '')
  const apiDirect = trimSlash(env.apiPublicUrl || '')
  const specs: RecommendedMonitorSpec[] = []

  if (site && isPublicHttpUrl(site)) {
    specs.push({
      key: 'shop',
      friendlyName: recommendedFriendlyName('Storefront'),
      url: site,
      type: 'keyword',
      keywordValue: 'Idea di Luce',
      description: 'Homepage pubblica: HTTP 200 e presenza del brand (pagina vuota o errore HTML resta 200).',
    })
    specs.push({
      key: 'api-site',
      friendlyName: recommendedFriendlyName('API (sito)'),
      url: `${site}/api/v1/health`,
      type: 'keyword',
      keywordValue: '"status":"ok"',
      description: 'Liveness dell’API via rewrite dello shop, lo stesso percorso usato dal browser.',
    })
    specs.push({
      key: 'catalog',
      friendlyName: recommendedFriendlyName('Catalogo'),
      url: `${site}/api/v1/catalog/catalog-index?locale=IT`,
      type: 'keyword',
      keywordValue: '"syncedAt"',
      description: 'Indice catalogo servito dalla PWA (resta su anche se Odoo è giù, finché la cache è calda).',
    })
    specs.push({
      key: 'sitemap',
      friendlyName: recommendedFriendlyName('Sitemap'),
      url: `${site}/sitemap.xml`,
      type: 'keyword',
      keywordValue: 'urlset',
      description: 'Sitemap XML pubblica (SEO).',
    })
    specs.push({
      key: 'merchant-feed',
      friendlyName: recommendedFriendlyName('Merchant feed'),
      url: `${site}/merchant-feed.xml`,
      type: 'keyword',
      keywordValue: 'rss',
      description: 'Feed Google Merchant Center.',
    })
  }

  if (
    apiDirect &&
    isPublicHttpUrl(apiDirect) &&
    (!site ||
      !isPublicHttpUrl(site) ||
      normalizeMonitorUrl(`${apiDirect}/health`) !== normalizeMonitorUrl(`${site}/api/v1/health`))
  ) {
    specs.push({
      key: 'api-direct',
      friendlyName: recommendedFriendlyName('API (diretta)'),
      url: `${apiDirect}/health`,
      type: 'keyword',
      keywordValue: '"status":"ok"',
      description: 'Health check DigitalOcean sull’URL pubblico dell’API, senza passare dallo shop.',
    })
  }

  if (odoo && isPublicHttpUrl(odoo)) {
    specs.push({
      key: 'odoo',
      friendlyName: recommendedFriendlyName('Odoo'),
      url: odoo,
      type: 'http',
      description: 'Istanza ERP (catalogo, ordini, email). Single point esterno.',
    })
  }

  if (admin && isPublicHttpUrl(admin)) {
    specs.push({
      key: 'admin',
      friendlyName: recommendedFriendlyName('Back office'),
      url: admin,
      type: 'http',
      description: 'SPA admin su App Platform.',
    })
  }

  return specs
}

export type ExistingMonitorMatch = {
  id: number
  url: string
  friendlyName: string
}

export function matchRecommendedMonitor(
  spec: RecommendedMonitorSpec,
  monitors: ExistingMonitorMatch[],
): ExistingMonitorMatch | null {
  const wantUrl = normalizeMonitorUrl(spec.url)
  const byUrl = monitors.find((m) => normalizeMonitorUrl(m.url) === wantUrl)
  if (byUrl) return byUrl
  const wantName = spec.friendlyName.trim().toLowerCase()
  return monitors.find((m) => m.friendlyName.trim().toLowerCase() === wantName) ?? null
}
