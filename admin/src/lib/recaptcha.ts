export const RECAPTCHA_ACTIONS = {
  adminLogin: 'admin_login',
} as const

export type RecaptchaAction = (typeof RECAPTCHA_ACTIONS)[keyof typeof RECAPTCHA_ACTIONS]

type Grecaptcha = {
  ready: (callback: () => void) => void
  execute: (siteKey: string, options: { action: string }) => Promise<string>
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha
  }
}

let scriptPromise: Promise<void> | null = null

export function getRecaptchaSiteKey(): string | undefined {
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || undefined
}

export function isRecaptchaEnabled(): boolean {
  return Boolean(getRecaptchaSiteKey())
}

function loadRecaptchaScript(siteKey: string): Promise<void> {
  if (window.grecaptcha?.execute) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('RECAPTCHA_LOAD_FAILED'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

async function executeRecaptcha(action: RecaptchaAction): Promise<string> {
  const siteKey = getRecaptchaSiteKey()
  if (!siteKey) {
    throw new Error('RECAPTCHA_NOT_CONFIGURED')
  }

  await loadRecaptchaScript(siteKey)

  return new Promise((resolve, reject) => {
    const grecaptcha = window.grecaptcha
    if (!grecaptcha?.execute) {
      reject(new Error('RECAPTCHA_LOAD_FAILED'))
      return
    }

    grecaptcha.ready(() => {
      void grecaptcha
        .execute(siteKey, { action })
        .then(resolve)
        .catch(() => reject(new Error('RECAPTCHA_EXECUTE_FAILED')))
    })
  })
}

export async function getRecaptchaToken(action: RecaptchaAction): Promise<string | undefined> {
  if (!isRecaptchaEnabled()) return undefined
  return executeRecaptcha(action)
}
