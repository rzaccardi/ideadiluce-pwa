'use client'

import { useCallback } from 'react'
import { useLocale } from '@/context/locale-context'
import { t as translate, tParams as translateParams, type MessageKey } from '@/i18n/messages'

export function useI18n() {
  const { locale } = useLocale()
  const t = useCallback((key: MessageKey) => translate(locale, key), [locale])
  const tParams = useCallback(
    (key: MessageKey, params: Record<string, string | number>) =>
      translateParams(locale, key, params),
    [locale],
  )
  return { locale, t, tParams }
}
