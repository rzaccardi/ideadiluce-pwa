import { useCallback } from 'react'
import { useLocale } from '@/context/locale-context'
import { localizePath } from '@/lib/locale'

/** Path prefissato con la lingua attiva (IT = nessun prefisso). */
export function useLocalePath() {
  const { locale } = useLocale()
  return useCallback((path: string) => localizePath(path, locale), [locale])
}
