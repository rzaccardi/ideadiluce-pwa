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

export function isCookiebotEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_COOKIEBOT_CBID?.trim())
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
