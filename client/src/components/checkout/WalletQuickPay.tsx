'use client'

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { CheckoutElementsProvider } from '@stripe/react-stripe-js/checkout'
import { loadStripe, type Stripe } from '@stripe/stripe-js'
import { api } from '@/api/endpoints'
import { authStore } from '@/features/auth'
import { addItem } from '@/features/cart'
import { ApiRequestError } from '@/types/api'
import type { PaymentSessionDTO, UserAddressDTO } from '@/types/dto'
import { getStripePublishableKey } from '@/lib/env'
import { normalizeStripeClientSecret } from '@/lib/stripe-client-secret'
import { checkoutStripeAppearance } from '@/components/checkout/stripe-ui/constants'
import { WalletExpressCheckout } from '@/components/checkout/WalletExpressCheckout'
import { useLocale } from '@/context/locale-context'
import { useI18n } from '@/hooks/use-i18n'
import { t as translate } from '@/i18n/messages'
import { cn } from '@/utils/cn'

type ProductLine = {
  productRef: string
  quantity: number
  variantRef?: string | null
}

type Props = {
  disabled?: boolean
  className?: string
  productLine?: ProductLine
  /** Cambia quando il carrello cambia, per rigenerare la sessione wallet. */
  cartFingerprint?: string
}

function addressPayload(address: UserAddressDTO) {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone,
  }
}

function shippingFingerprint(address: UserAddressDTO | null | undefined) {
  if (!address) return ''
  return [
    address.firstName,
    address.lastName,
    address.line1,
    address.line2 ?? '',
    address.city,
    address.postalCode,
    address.country,
    address.phone ?? '',
  ].join(':')
}

export function WalletQuickPay({ disabled, className, productLine, cartFingerprint }: Props) {
  const { t } = useI18n()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const auth = useSnapshot(authStore)
  const [stripeEnabled, setStripeEnabled] = useState<boolean | null>(null)
  const [session, setSession] = useState<PaymentSessionDTO | null>(null)
  const [needsCheckout, setNeedsCheckout] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletAvailable, setWalletAvailable] = useState<boolean | null>(null)

  const envPublishableKey = getStripePublishableKey()
  const [remotePublishableKey, setRemotePublishableKey] = useState<string | null>(null)

  const shippingFp = shippingFingerprint(auth.me?.shippingAddress)

  const prepareKey = useMemo(
    () =>
      [
        auth.me?.id ?? 'guest',
        auth.me?.email ?? '',
        shippingFp,
        productLine?.productRef ?? '',
        productLine?.quantity ?? '',
        productLine?.variantRef ?? '',
        cartFingerprint ?? '',
      ].join('|'),
    [
      auth.me?.id,
      auth.me?.email,
      shippingFp,
      productLine?.productRef,
      productLine?.quantity,
      productLine?.variantRef,
      cartFingerprint,
    ],
  )

  useEffect(() => {
    if (disabled) return
    let cancelled = false

    void (async () => {
      setLoading(true)
      setError(null)
      setSession(null)
      setNeedsCheckout(false)
      setWalletAvailable(null)

      try {
        const config = envPublishableKey ? { enabled: true, publishableKey: envPublishableKey } : await api.payments.stripeConfig()
        if (cancelled) return
        if (!config.enabled) {
          setStripeEnabled(false)
          return
        }
        setStripeEnabled(true)
        if (!envPublishableKey && config.publishableKey) {
          setRemotePublishableKey(config.publishableKey)
        }

        const shippingAddress = auth.me?.shippingAddress
        const data = await api.payments.prepareWalletCheckout({
          productRef: productLine?.productRef,
          quantity: productLine?.quantity,
          variantRef: productLine?.variantRef,
          email: auth.me?.email,
          shippingAddress: shippingAddress ? addressPayload(shippingAddress) : undefined,
        })
        if (!cancelled) setSession(data)
      } catch (e) {
        if (cancelled) return
        if (e instanceof ApiRequestError && e.code === 'WALLET_ADDRESS_REQUIRED') {
          setNeedsCheckout(true)
          return
        }
        setError(
          e instanceof ApiRequestError
            ? (e.userMessage ?? e.message)
            : translate(locale, 'checkout.error.generic'),
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [disabled, prepareKey, envPublishableKey, locale])

  const publishableKey = envPublishableKey ?? session?.publishableKey ?? remotePublishableKey

  const stripePromise = useMemo<Promise<Stripe | null> | null>(() => {
    if (!publishableKey) return null
    return loadStripe(publishableKey)
  }, [publishableKey])

  const normalizedClientSecret = useMemo(
    () => (session?.clientSecret ? normalizeStripeClientSecret(session.clientSecret) : null),
    [session?.clientSecret],
  )

  if (disabled || stripeEnabled === false) return null

  async function goToCheckoutWithCart() {
    if (productLine) {
      try {
        await addItem(productLine.productRef, productLine.quantity, productLine.variantRef)
      } catch {
        /* carrello non aggiornato: checkout mostrerà lo stato attuale */
      }
    }
    navigate('/checkout')
  }

  if (needsCheckout) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        <button
          type="button"
          onClick={() => void goToCheckoutWithCart()}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-100"
        >
          {t('walletQuickPay.checkoutFallback')}
        </button>
      </div>
    )
  }

  if (loading && !session) {
    return (
      <div className={cn('min-w-[140px]', className)} aria-busy>
        <div className="h-11 animate-pulse rounded-lg bg-zinc-100" />
      </div>
    )
  }

  if (error || !session?.clientSecret || !stripePromise || !normalizedClientSecret) {
    return null
  }

  if (walletAvailable === false) {
    return null
  }

  return (
    <div className={cn('min-w-[140px] shrink-0', className)}>
      <CheckoutElementsProvider
        stripe={stripePromise}
        options={{
          clientSecret: normalizedClientSecret,
          elementsOptions: {
            appearance: checkoutStripeAppearance,
          },
        }}
      >
        <WalletExpressCheckout
          orderId={session.orderId}
          onError={setError}
          onAvailableChange={setWalletAvailable}
          onPaymentSuccess={(paidOrderId) => {
            navigate(`/checkout/result/${paidOrderId}`, { replace: true })
          }}
        />
      </CheckoutElementsProvider>
      {error ? (
        <p className="mt-2 text-xs text-[#df1b41]">
          {error}{' '}
          <Link to="/checkout" className="underline">
            {t('walletQuickPay.openCheckout')}
          </Link>
        </p>
      ) : null}
    </div>
  )
}
