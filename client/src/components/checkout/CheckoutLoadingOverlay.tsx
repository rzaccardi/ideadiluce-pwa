'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CheckoutStep } from '@/features/checkout'
import type { CheckoutInitLoadingPhase } from '@/features/checkout/checkout.store'
import { useI18n } from '@/hooks/use-i18n'
import type { MessageKey } from '@/i18n/messages'
import {
  CheckoutLoadingBulb,
  CheckoutLoadingPin,
  CheckoutLoadingRing,
  CheckoutLoadingShield,
  CheckoutLoadingTruck,
} from './CheckoutIllustrations'

export type CheckoutLoadingIcon = 'pin' | 'truck' | 'shield' | 'bulb'

export type CheckoutLoadingScope = 'fullscreen' | 'step'

type LoadingState = {
  visible: boolean
  icon: CheckoutLoadingIcon
  messageKey: MessageKey
  scope: CheckoutLoadingScope
}

const ADDRESS_STEPS: CheckoutStep[] = [
  'account',
  'customer_type',
  'addresses',
  'billing',
  'shipping',
  'delivery_recipient',
]

/** Tempo minimo di visualizzazione per evitare flash impercettibili tra step. */
const OVERLAY_MIN_DISPLAY_MS = 450
const OVERLAY_HIDE_DELAY_MS = 180

export function resolveCheckoutLoading(params: {
  step: CheckoutStep
  isLoading: boolean
  isPaying: boolean
  cartRefreshing: boolean
  initLoadingPhase: CheckoutInitLoadingPhase | null
  addressPrefillLoading: boolean
  transitionToPaymentLoading: boolean
  shippingQuotesLoading: boolean
  shippingSelecting: boolean
  cartLoading: boolean
}): LoadingState | null {
  const {
    step,
    isLoading,
    isPaying,
    cartRefreshing,
    initLoadingPhase,
    addressPrefillLoading,
    transitionToPaymentLoading,
    shippingQuotesLoading,
    shippingSelecting,
    cartLoading,
  } = params

  const accountInitScope: CheckoutLoadingScope =
    step === 'account' || step === 'customer_type' ? 'step' : 'fullscreen'

  if (isPaying) {
    return { visible: true, icon: 'shield', messageKey: 'checkout.loading.payment', scope: 'fullscreen' }
  }

  if (cartRefreshing) {
    return { visible: true, icon: 'bulb', messageKey: 'checkout.loading.cart', scope: 'fullscreen' }
  }

  if (initLoadingPhase === 'anagrafica') {
    return {
      visible: true,
      icon: 'bulb',
      messageKey: 'checkout.loading.profile',
      scope: accountInitScope,
    }
  }

  if (initLoadingPhase === 'indirizzi' || addressPrefillLoading) {
    return {
      visible: true,
      icon: 'pin',
      messageKey: 'checkout.loading.addresses',
      scope: accountInitScope,
    }
  }

  if (transitionToPaymentLoading) {
    return {
      visible: true,
      icon: 'pin',
      messageKey: 'checkout.loading.addresses',
      scope: 'fullscreen',
    }
  }

  if (initLoadingPhase === 'spedizioni' || shippingQuotesLoading || shippingSelecting) {
    return {
      visible: true,
      icon: 'truck',
      messageKey: 'checkout.loading.shipping',
      scope: accountInitScope,
    }
  }

  if (cartLoading) {
    return { visible: true, icon: 'bulb', messageKey: 'skeleton.loadingCheckout', scope: 'fullscreen' }
  }

  if (!isLoading) return null

  if (step === 'shipping_method' || step === 'delivery_recipient') {
    return { visible: true, icon: 'truck', messageKey: 'checkout.loading.shipping', scope: 'fullscreen' }
  }

  if (step === 'payment' || step === 'review') {
    return { visible: true, icon: 'shield', messageKey: 'checkout.loading.payment', scope: 'fullscreen' }
  }

  if (ADDRESS_STEPS.includes(step)) {
    return { visible: true, icon: 'pin', messageKey: 'checkout.loading.addresses', scope: 'fullscreen' }
  }

  return { visible: true, icon: 'bulb', messageKey: 'checkout.processing', scope: 'fullscreen' }
}

export function useStableCheckoutLoading(state: LoadingState | null): LoadingState | null {
  const [stable, setStable] = useState<LoadingState | null>(state)
  const shownAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (state?.visible) {
      if (shownAtRef.current == null) {
        shownAtRef.current = Date.now()
      }
      setStable(state)
      return
    }

    if (!stable?.visible) return

    const elapsed = shownAtRef.current != null ? Date.now() - shownAtRef.current : OVERLAY_MIN_DISPLAY_MS
    const delay = Math.max(OVERLAY_HIDE_DELAY_MS, OVERLAY_MIN_DISPLAY_MS - elapsed)

    const timer = setTimeout(() => {
      setStable(null)
      shownAtRef.current = null
    }, delay)

    return () => clearTimeout(timer)
  }, [state?.visible, state?.icon, state?.messageKey, state?.scope, stable?.visible])

  return stable
}

function LoadingIcon({ icon }: { icon: CheckoutLoadingIcon }) {
  switch (icon) {
    case 'pin':
      return <CheckoutLoadingPin />
    case 'truck':
      return <CheckoutLoadingTruck />
    case 'shield':
      return <CheckoutLoadingShield />
    default:
      return <CheckoutLoadingBulb />
  }
}

type Props = {
  icon: CheckoutLoadingIcon
  messageKey: MessageKey
  scope?: CheckoutLoadingScope
}

function CheckoutLoadingCard({
  icon,
  messageKey,
}: {
  icon: CheckoutLoadingIcon
  messageKey: MessageKey
}) {
  const { t } = useI18n()

  return (
    <div className="flex w-full max-w-[min(100%,20rem)] flex-col items-center gap-4 rounded-[20px] bg-idl-tech-panel px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:max-w-xs sm:gap-5 sm:px-10 sm:py-9">
      <div className="relative flex size-[76px] items-center justify-center">
        <CheckoutLoadingRing />
        <LoadingIcon icon={icon} />
      </div>
      <div className="text-center">
        <p className="text-[14.5px] font-bold text-idl-graphite">{t(messageKey)}</p>
        <p className="mt-1 text-xs text-[#9298a3]">{t('checkout.loading.dontClose')}</p>
      </div>
    </div>
  )
}

export function CheckoutLoadingOverlay({ icon, messageKey, scope = 'fullscreen' }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (scope !== 'fullscreen') return

    const main = document.querySelector('.checkout-shell > main')
    const prevBodyOverflow = document.body.style.overflow
    const prevMainOverflow = main instanceof HTMLElement ? main.style.overflow : ''

    document.body.style.overflow = 'hidden'
    if (main instanceof HTMLElement) main.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevBodyOverflow
      if (main instanceof HTMLElement) main.style.overflow = prevMainOverflow
    }
  }, [scope])

  if (!mounted) return null

  if (scope === 'step') {
    return (
      <div
        className="checkout-loading-overlay absolute inset-0 z-[50] flex items-center justify-center bg-idl-tech-panel/72 p-4 backdrop-blur-[1.5px]"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <CheckoutLoadingCard icon={icon} messageKey={messageKey} />
      </div>
    )
  }

  return createPortal(
    <div
      className="checkout-loading-overlay fixed inset-0 z-[200] flex h-dvh max-h-dvh w-full touch-none items-center justify-center bg-[rgba(22,19,13,0.62)] p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <CheckoutLoadingCard icon={icon} messageKey={messageKey} />
    </div>,
    document.body,
  )
}
