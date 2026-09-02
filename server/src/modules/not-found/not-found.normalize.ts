export const NOT_FOUND_REFERRER_KINDS = ['none', 'internal', 'legacy', 'external'] as const
export type NotFoundReferrerKind = (typeof NOT_FOUND_REFERRER_KINDS)[number]

export const NOT_FOUND_PATH_KINDS = [
  'product',
  'category',
  'brand',
  'guide',
  'room',
  'content',
  'probe',
  'other',
] as const
export type NotFoundPathKind = (typeof NOT_FOUND_PATH_KINDS)[number]

const LOCALE_PREFIXES = ['/en', '/es', '/fr', '/de', '/ro'] as const

const BOT_UA_RE =
  /googlebot|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|slackbot|ahrefs|semrush|mj12bot|dotbot|petalbot|gptbot|claudebot|bytespider|applebot|pingdom|uptimerobot|statuscake|curl\/|wget\/|python-requests|go-http-client|axios\/|node-fetch|prerender|lighthouse|headlesschrome|phantomjs/i

const PROBE_EXT_RE = /\.(php|asp|aspx|jsp|cgi|env|git|sql|bak|zip|tar|gz|xml|json|yml|yaml|ini)$/i
const PROBE_PATH_RE =
  /^\/(wp-admin|wp-login|wp-content|wp-includes|wordpress|xmlrpc|cgi-bin|phpmyadmin|vendor|\.well-known|\.git|\.env)/i

export const DEFAULT_LEGACY_HOSTS = ['old.ideadiluce.it', 'old.ideadiluce.com']

export function stripLocalePrefix(pathname: string): string {
  for (const prefix of LOCALE_PREFIXES) {
    if (pathname === prefix) return '/'
    if (pathname.startsWith(`${prefix}/`)) {
      const rest = pathname.slice(prefix.length)
      return rest.startsWith('/') ? rest : `/${rest}`
    }
  }
  return pathname
}

export function normalizeNotFoundPath(raw: string): string | null {
  let value = raw.trim()
  if (!value) return null

  if (/^https?:\/\//i.test(value)) {
    try {
      value = new URL(value).pathname
    } catch {
      return null
    }
  }

  if (value.includes('\n') || value.includes('\r') || value.includes('\\')) return null
  value = value.split('#')[0] ?? value
  const qIndex = value.indexOf('?')
  if (qIndex >= 0) value = value.slice(0, qIndex)
  if (!value.startsWith('/')) value = `/${value}`

  try {
    value = decodeURIComponent(value)
  } catch {
    /* keep encoded */
  }

  value = value.replace(/\/{2,}/g, '/')
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1)
  if (value.length > 500 || value.length < 1) return null
  if (value.startsWith('/_next') || value.startsWith('/api')) return null
  return value
}

export function normalizeQueryString(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim().replace(/^\?/, '')
  if (!trimmed) return null
  return trimmed.slice(0, 300)
}

export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false
  return BOT_UA_RE.test(userAgent)
}

export function isProbePath(path: string): boolean {
  const stripped = stripLocalePrefix(path)
  return PROBE_EXT_RE.test(stripped) || PROBE_PATH_RE.test(stripped)
}

export function classifyPathKind(path: string): NotFoundPathKind {
  if (isProbePath(path)) return 'probe'
  const stripped = stripLocalePrefix(path).toLowerCase()
  if (stripped.startsWith('/prodotto/') || stripped.startsWith('/product/')) return 'product'
  if (
    stripped.startsWith('/categoria/') ||
    stripped.startsWith('/categoria-prodotto') ||
    stripped.startsWith('/product-category') ||
    stripped.startsWith('/attacco') ||
    stripped === '/negozio' ||
    stripped.startsWith('/negozio/') ||
    stripped === '/shop' ||
    stripped.startsWith('/shop/')
  ) {
    return 'category'
  }
  if (stripped === '/brand' || stripped.startsWith('/brand/')) return 'brand'
  if (stripped.startsWith('/guide/') || stripped.startsWith('/guides/')) return 'guide'
  if (stripped.startsWith('/ambienti/')) return 'room'
  if (stripped.startsWith('/pagina/') || stripped.startsWith('/page/')) return 'content'
  return 'other'
}

function hostnameOf(value: string): string | null {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host.startsWith('www.') ? host.slice(4) : host
  } catch {
    return null
  }
}

function hostsFromUrls(urls: Array<string | undefined | null>): string[] {
  const hosts = new Set<string>()
  for (const url of urls) {
    if (!url) continue
    const host = hostnameOf(url.startsWith('http') ? url : `https://${url}`)
    if (host) hosts.add(host)
  }
  return [...hosts]
}

export function internalHostsFromSiteUrls(urls: Array<string | undefined | null>): string[] {
  const hosts = new Set(hostsFromUrls(urls))
  hosts.add('localhost')
  hosts.add('127.0.0.1')
  return [...hosts]
}

export function classifyReferrer(
  referrer: string | null | undefined,
  internalHosts: string[],
  legacyHosts: string[] = DEFAULT_LEGACY_HOSTS,
): {
  referrer: string | null
  referrerHost: string | null
  referrerKind: NotFoundReferrerKind
} {
  const raw = referrer?.trim() || null
  if (!raw) {
    return { referrer: null, referrerHost: null, referrerKind: 'none' }
  }

  const clipped = raw.slice(0, 500)
  const host = hostnameOf(clipped.startsWith('http') ? clipped : `https://${clipped}`)
  if (!host) {
    return { referrer: clipped, referrerHost: null, referrerKind: 'external' }
  }

  const legacy = new Set(legacyHosts.map((h) => h.replace(/^www\./, '')))
  const internal = new Set(internalHosts.map((h) => h.replace(/^www\./, '')))

  let kind: NotFoundReferrerKind = 'external'
  if (internal.has(host)) kind = 'internal'
  else if (legacy.has(host)) kind = 'legacy'

  return { referrer: clipped, referrerHost: host, referrerKind: kind }
}
