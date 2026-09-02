'use client'

import { useCallback, useEffect, useState } from 'react'
import { useLocale } from '@/context/locale-context'
import {
  getLocaleMessagesGeneration,
  subscribeLocaleMessages,
  t as translate,
  tParams as translateParams,
  type MessageKey,
} from '@/i18n/messages'

export function useI18n() {
  const { locale } = useLocale()
  const [messagesGeneration, setMessagesGeneration] = useState(getLocaleMessagesGeneration)

  useEffect(() => subscribeLocaleMessages(() => setMessagesGeneration(getLocaleMessagesGeneration())), [])

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale, messagesGeneration])
  const tParams = useCallback(
    (key: MessageKey, params: Record<string, string | number>) =>
      translateParams(locale, key, params),
    [locale, messagesGeneration],
  )
  return { locale, t, tParams }
}
