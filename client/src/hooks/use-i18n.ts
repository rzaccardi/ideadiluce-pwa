'use client'

import { useLocale } from '@/context/locale-context'
import { t, tParams, type MessageKey } from '@/i18n/messages'

export function useI18n() {
  const { locale } = useLocale()
  return {
    locale,
    t: (key: MessageKey) => t(locale, key),
    tParams: (key: MessageKey, params: Record<string, string | number>) =>
      tParams(locale, key, params),
  }
}
