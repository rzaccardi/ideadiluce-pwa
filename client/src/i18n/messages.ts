import type { PwaLocale } from '@/lib/locale'
import { messages as IT } from './messages/it'
import type { MessageKey } from './messages/keys'

export type { MessageKey } from './messages/keys'

const localeCache = new Map<PwaLocale, Record<MessageKey, string>>([['IT', IT]])

const localeLoaders: Record<Exclude<PwaLocale, 'IT'>, () => Promise<{ messages: Record<MessageKey, string> }>> = {
  EN: () => import('./messages/en'),
  ES: () => import('./messages/es'),
  FR: () => import('./messages/fr'),
  DE: () => import('./messages/de'),
}

/** Precarica i messaggi della locale attiva (chunk separato per lingua). */
export async function preloadLocale(locale: PwaLocale): Promise<void> {
  if (localeCache.has(locale)) return
  if (locale === 'IT') {
    localeCache.set('IT', IT)
    return
  }
  const mod = await localeLoaders[locale]()
  localeCache.set(locale, mod.messages)
}

function messagesFor(locale: PwaLocale): Record<MessageKey, string> {
  return localeCache.get(locale) ?? IT
}

/** @deprecated Usare MAP solo se necessario; preferire preloadLocale + t(). */
export const MAP: Record<PwaLocale, Record<MessageKey, string>> = {
  get IT() {
    return messagesFor('IT')
  },
  get EN() {
    return messagesFor('EN')
  },
  get ES() {
    return messagesFor('ES')
  },
  get FR() {
    return messagesFor('FR')
  },
  get DE() {
    return messagesFor('DE')
  },
}

export function t(locale: PwaLocale, key: MessageKey): string {
  const map = messagesFor(locale)
  return map[key] ?? IT[key] ?? key
}

export function tParams(
  locale: PwaLocale,
  key: MessageKey,
  params: Record<string, string | number>,
): string {
  let text = t(locale, key)
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }
  return text
}
