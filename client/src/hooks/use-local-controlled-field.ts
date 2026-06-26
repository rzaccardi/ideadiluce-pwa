'use client'

import { useEffect, useState, type ChangeEvent, type FocusEvent } from 'react'

type Options = {
  /** Normalizza il valore salvato (es. uppercase) — applicato solo on blur. */
  normalize?: (value: string) => string
}

/**
 * Evita il salto del cursore negli input controllati da store globali (Valtio):
 * mentre il campo ha focus usa stato locale; il store si aggiorna ma non sovrascrive il testo in editing.
 */
export function useLocalControlledField(
  storeValue: string,
  onStoreChange: (value: string) => void,
  options?: Options,
) {
  const [localValue, setLocalValue] = useState(storeValue)
  const [isFocused, setIsFocused] = useState(false)
  const normalize = options?.normalize

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(storeValue)
    }
  }, [storeValue, isFocused])

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const next = e.target.value
    setLocalValue(next)
    onStoreChange(next)
  }

  function handleFocus(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setIsFocused(true)
    setLocalValue(storeValue)
    return e
  }

  function handleBlur(e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setIsFocused(false)
    if (normalize) {
      const next = normalize(localValue)
      if (next !== localValue) {
        setLocalValue(next)
      }
      if (next !== storeValue) {
        onStoreChange(next)
      }
    }
    return e
  }

  return {
    value: isFocused ? localValue : storeValue,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
  }
}
