'use client'

import { useEffect } from 'react'
import { notify } from '@/lib/notify'

type Props = {
  message: string | null | undefined
}

/** Mostra un toast errore quando `message` cambia — niente banner inline. */
export function ToastOnError({ message }: Props) {
  useEffect(() => {
    if (message) notify.error(message)
  }, [message])
  return null
}

/** Mostra un toast successo quando `message` cambia. */
export function ToastOnSuccess({ message }: Props) {
  useEffect(() => {
    if (message) notify.success(message)
  }, [message])
  return null
}

/** Mostra un toast informativo quando `message` cambia. */
export function ToastOnInfo({ message }: Props) {
  useEffect(() => {
    if (message) notify.info(message)
  }, [message])
  return null
}

/** Mostra un toast warning quando `message` cambia. */
export function ToastOnWarning({ message }: Props) {
  useEffect(() => {
    if (message) notify.warning(message)
  }, [message])
  return null
}
