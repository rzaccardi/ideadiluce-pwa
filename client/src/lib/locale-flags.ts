import type { PwaLocale } from '@/lib/locale'
import flagDe from 'circle-flags/flags/de.svg'
import flagEs from 'circle-flags/flags/es.svg'
import flagFr from 'circle-flags/flags/fr.svg'
import flagGb from 'circle-flags/flags/gb.svg'
import flagIt from 'circle-flags/flags/it.svg'

/** Bandiere rotonde (circle-flags) incluse nel bundle via npm */
export const LOCALE_FLAG_SRC: Record<PwaLocale, string | { src: string }> = {
  IT: flagIt,
  EN: flagGb,
  ES: flagEs,
  FR: flagFr,
  DE: flagDe,
}

export function localeFlagUrl(locale: PwaLocale): string {
  const value = LOCALE_FLAG_SRC[locale]
  return typeof value === 'string' ? value : value.src
}
