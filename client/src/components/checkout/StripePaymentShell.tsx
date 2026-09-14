'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import { useSnapshot } from 'valtio/react'
import { StripePaymentForm, type StripePaymentFormHandle } from './StripePaymentForm'
import { getCheckoutStripeAppearance } from './stripe-ui/constants'
import { useTheme } from '@/context/theme-context'
import { getStripePublishableKey } from '@/lib/env'
import { normalizeStripeClientSecret } from '@/lib/stripe-client-secret'
import { getStripePromise, preloadStripe, preloadStripeCheckoutModule, resolvePublishableKey } from '@/lib/stripe-loader'
import {
  checkoutStore,
  getCheckoutBillingAddress,
  getCheckoutShippingAddress,
} from '@/features/checkout'
import { stripeCheckoutAddressDefaults } from '@/lib/stripe-checkout-address'

type Props = {
  clientSecret: string
  orderId: string
  publishableKey?: string | null
  formRef: React.RefObject<StripePaymentFormHandle | null>
  onError: (message: string) => void
  onReadyChange?: (ready: boolean) => void
  onBeforeConfirm?: () => Promise<void>
  onPaymentSuccess?: (orderId: string) => void
}

export function StripePaymentShell({
  clientSecret,
  orderId,
  publishableKey: publishableKeyProp,
  formRef,
  onError,
  onReadyChange,
  onBeforeConfirm,
  onPaymentSuccess,
}: Props) {
  const { isDark } = useTheme()
  const checkout = useSnapshot(checkoutStore)
  const stripeAppearance = getCheckoutStripeAppearance(isDark)
  const envPublishableKey = getStripePublishableKey()
  const [remotePublishableKey, setRemotePublishableKey] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(!envPublishableKey && !publishableKeyProp)

  useEffect(() => {
    preloadStripe(publishableKeyProp)
    preloadStripeCheckoutModule()
  }, [publishableKeyProp])

  useEffect(() => {
    if (envPublishableKey || publishableKeyProp) {
      setConfigLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const key = await resolvePublishableKey()
        if (!cancelled) setRemotePublishableKey(key)
      } catch {
        if (!cancelled) setRemotePublishableKey(null)
      } finally {
        if (!cancelled) setConfigLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [envPublishableKey, publishableKeyProp])

  const publishableKey = envPublishableKey ?? publishableKeyProp ?? remotePublishableKey

  const stripePromise = useMemo(() => {
    if (!publishableKey) return null
    return getStripePromise(publishableKey)
  }, [publishableKey])

  const normalizedClientSecret = useMemo(
    () => normalizeStripeClientSecret(clientSecret),
    [clientSecret],
  )

  const stripeAddressDefaults = useMemo(
    () => stripeCheckoutAddressDefaults(getCheckoutBillingAddress(), getCheckoutShippingAddress()),
    [
      checkout.draft.billing,
      checkout.draft.shipping,
      checkout.draft.billingSameAsShipping,
      checkout.dropshipAddress,
      checkout.deliveryRecipient,
    ],
  )

  if (configLoading) {
    return (
      <div className="rounded-xl border border-idl-tech-border bg-idl-tech-chip px-4 py-6 text-sm text-idl-muted">
        Caricamento pagamento Stripe…
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <p className="text-sm text-[#df1b41]">
        Configura{' '}
        <code className="font-mono text-xs">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> o{' '}
        <code className="font-mono text-xs">STRIPE_PUBLISHABLE_KEY</code> nel file{' '}
        <code className="font-mono text-xs">.env</code> root per abilitare i pagamenti Stripe.
      </p>
    )
  }

  return (
    <CheckoutElementsProvider
      key={isDark ? 'stripe-dark' : 'stripe-light'}
      stripe={stripePromise}
      options={{
        clientSecret: normalizedClientSecret,
        ...(stripeAddressDefaults ? { defaultValues: stripeAddressDefaults } : {}),
        elementsOptions: {
          appearance: stripeAppearance,
        },
      }}
    >
      <StripePaymentForm
        ref={formRef}
        orderId={orderId}
        onError={onError}
        onReadyChange={onReadyChange}
        onBeforeConfirm={onBeforeConfirm}
        onPaymentSuccess={onPaymentSuccess}
      />
    </CheckoutElementsProvider>
  )
}
