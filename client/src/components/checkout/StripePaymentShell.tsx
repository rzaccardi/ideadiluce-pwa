'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import { StripePaymentForm, type StripePaymentFormHandle } from './StripePaymentForm'
import { checkoutStripeAppearance } from './stripe-ui/constants'
import { getStripePublishableKey } from '@/lib/env'
import { normalizeStripeClientSecret } from '@/lib/stripe-client-secret'
import { getStripePromise, preloadStripe, preloadStripeCheckoutModule, resolvePublishableKey } from '@/lib/stripe-loader'

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

  if (configLoading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
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
      stripe={stripePromise}
      options={{
        clientSecret: normalizedClientSecret,
        elementsOptions: {
          appearance: checkoutStripeAppearance,
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
