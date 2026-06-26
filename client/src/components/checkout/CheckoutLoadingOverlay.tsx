'use client'

import type { CheckoutStep } from '@/features/checkout'
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

type LoadingState = {
  visible: boolean
  icon: CheckoutLoadingIcon
  messageKey: MessageKey
}

const ADDRESS_STEPS: CheckoutStep[] = [
  'account',
  'customer_type',
  'billing',
  'shipping',
  'delivery_recipient',
]

export function resolveCheckoutLoading(params: {
  step: CheckoutStep
  isLoading: boolean
  isPaying: boolean
  addressPrefillLoading: boolean
  shippingQuotesLoading: boolean
  shippingSelectingRef: string | null
  cartLoading: boolean
}): LoadingState | null {
  const {
    step,
    isLoading,
    isPaying,
    addressPrefillLoading,
    shippingQuotesLoading,
    shippingSelectingRef,
    cartLoading,
  } = params

  if (isPaying) {
    return { visible: true, icon: 'shield', messageKey: 'checkout.loading.payment' }
  }

  if (addressPrefillLoading) {
    return { visible: true, icon: 'pin', messageKey: 'checkout.address.resolvingPrefill' }
  }

  if (shippingSelectingRef || shippingQuotesLoading) {
    return { visible: true, icon: 'truck', messageKey: 'checkout.loading.shipping' }
  }

  if (cartLoading) {
    return { visible: true, icon: 'bulb', messageKey: 'skeleton.loadingCheckout' }
  }

  if (!isLoading) return null

  if (step === 'shipping_method' || step === 'delivery_recipient') {
    return { visible: true, icon: 'truck', messageKey: 'checkout.loading.shipping' }
  }

  if (step === 'payment' || step === 'review') {
    return { visible: true, icon: 'shield', messageKey: 'checkout.loading.payment' }
  }

  if (ADDRESS_STEPS.includes(step)) {
    return { visible: true, icon: 'pin', messageKey: 'checkout.loading.address' }
  }

  return { visible: true, icon: 'bulb', messageKey: 'checkout.processing' }
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
}

export function CheckoutLoadingOverlay({ icon, messageKey }: Props) {
  const { t } = useI18n()

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(22,19,13,0.55)] p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-[min(100%,20rem)] flex-col items-center gap-4 rounded-[20px] bg-white px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.34)] sm:max-w-xs sm:gap-5 sm:px-10 sm:py-9">
        <div className="relative flex size-[76px] items-center justify-center">
          <CheckoutLoadingRing />
          <LoadingIcon icon={icon} />
        </div>
        <div className="text-center">
          <p className="text-[14.5px] font-bold text-[#14161b]">{t(messageKey)}</p>
          <p className="mt-1 text-xs text-[#9298a3]">{t('checkout.loading.dontClose')}</p>
        </div>
      </div>
    </div>
  )
}
