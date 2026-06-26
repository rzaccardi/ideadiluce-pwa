import type { PwaLocale } from '@/lib/locale'

export const ARFLY_LANG_BY_PWA: Record<PwaLocale, string> = {
  IT: 'it_IT',
  EN: 'en_US',
  FR: 'fr_FR',
  DE: 'de_DE',
  ES: 'es_ES',
}

export function toArflyLang(locale: PwaLocale): string {
  return ARFLY_LANG_BY_PWA[locale]
}
