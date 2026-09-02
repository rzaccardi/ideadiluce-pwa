export type CookiebotConsent = {
  necessary: boolean
  preferences: boolean
  statistics: boolean
  marketing: boolean
  method: 'implied' | 'explicit' | null
}

export type CookiebotApi = {
  consent: CookiebotConsent
  consented: boolean
  declined: boolean
  hasResponse: boolean
  show: () => void
  hide: () => void
  renew: () => void
  runScripts: () => void
  withdraw: () => void
  getScript: (url: string, async?: boolean, callback?: () => void) => void
  submitCustomConsent: (
    optinPreferences: boolean,
    optinStatistics: boolean,
    optinMarketing: boolean,
  ) => void
}

declare global {
  interface Window {
    Cookiebot?: CookiebotApi
  }
}

/** Host su cui Cookiebot non è autorizzato (404 su configuration.js → SyntaxError in console). */
export function isLocalCookiebotHost(hostname: string): boolean {
  const host = hostname.trim().toLowerCase()
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]' ||
    host.endsWith('.localhost')
  )
}

export function resolveCookiebotCbid(params: {
  cbid: string | undefined
  nodeEnv: string | undefined
  siteUrl: string | undefined
}): string | undefined {
  const cbid = params.cbid?.trim()
  if (!cbid) return undefined
  if (params.nodeEnv === 'development') return undefined
  const siteUrl = params.siteUrl?.trim()
  if (siteUrl) {
    try {
      if (isLocalCookiebotHost(new URL(siteUrl).hostname)) return undefined
    } catch {
      // URL non valido: non bloccare Cookiebot in produzione per un SITE_URL malformato.
    }
  }
  return cbid
}

export function isCookiebotEnabled(): boolean {
  return Boolean(
    resolveCookiebotCbid({
      cbid: process.env.NEXT_PUBLIC_COOKIEBOT_CBID,
      nodeEnv: process.env.NODE_ENV,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    }),
  )
}

export function getCookiebotDeclarationSrc(cbid: string): string {
  return `https://consent.cookiebot.com/${encodeURIComponent(cbid)}/cd.js`
}

export function getCookiebot(): CookiebotApi | undefined {
  if (typeof window === 'undefined') return undefined
  return window.Cookiebot
}

export function renewCookieConsent(): void {
  getCookiebot()?.renew()
}

/** Esegue script `text/plain` + `data-cookieconsent` dopo navigazione client-side. */
export function runCookiebotScripts(): void {
  getCookiebot()?.runScripts()
}
