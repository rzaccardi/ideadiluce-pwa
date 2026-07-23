'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CheckoutLoadingBulb,
  CheckoutLoadingRing,
  CheckoutLoadingShield,
} from '@/components/checkout/CheckoutIllustrations'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'

export type AuthLoadingIcon = 'bulb' | 'shield'

type Props = {
  icon?: AuthLoadingIcon
  messageKey: MessageKey
  subMessageKey?: MessageKey
}

function LoadingIcon({ icon }: { icon: AuthLoadingIcon }) {
  return icon === 'shield' ? <CheckoutLoadingShield /> : <CheckoutLoadingBulb />
}

export function AuthLoadingOverlay({
  icon = 'bulb',
  messageKey,
  subMessageKey = 'checkout.loading.dontClose',
}: Props) {
  const { t } = useI18n()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBodyOverflow
    }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="checkout-loading-overlay fixed inset-0 z-[200] flex h-dvh max-h-dvh w-full touch-none items-center justify-center bg-[rgba(12, 12, 13,0.62)] p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-[min(100%,20rem)] flex-col items-center gap-4 rounded-[20px] bg-idl-tech-panel px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:max-w-xs sm:gap-5 sm:px-10 sm:py-9">
        <div className="relative flex size-[76px] items-center justify-center">
          <CheckoutLoadingRing />
          <LoadingIcon icon={icon} />
        </div>
        <div className="text-center">
          <p className="text-[14.5px] font-bold text-idl-graphite">{t(messageKey)}</p>
          <p className="mt-1 text-xs text-[#9298a3]">{t(subMessageKey)}</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}
