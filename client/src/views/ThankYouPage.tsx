'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParam, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { api } from '@/api/endpoints'
import type { ProductCardDTO, ThankYouOrderDTO } from '@/types/dto'
import { authStore } from '@/features/auth'
import { refreshCartAfterCheckout } from '@/features/cart'
import { resetOrdersStore } from '@/features/orders'
import { ApiRequestError } from '@/types/api'
import { ToastOnError } from '@/components/ToastFeedback'
import { PurchaseErrorPageView } from '@/components/checkout/purchase-error/PurchaseErrorPageView'
import { ThankYouPageView } from '@/components/checkout/thank-you/ThankYouPageView'
import { ThankYouPageSkeleton } from '@/components/checkout/thank-you/ThankYouPageSkeleton'
import { PageLoadTransition } from '@/components/motion'
import { useI18n } from '@/hooks/use-i18n'
import {
  isPaymentVerifyRetriable,
  isThankYouPaymentSucceeded,
  paymentVerifyMessageKey,
  shouldFinalizeStripeOnThankYou,
} from '@/lib/checkout-payment-result'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchThankYouOrder(orderId: string, sessionId?: string | null) {
  const maxAttempts = 5
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await api.orders.thankYou(orderId, { sessionId: sessionId ?? undefined })
    } catch (e) {
      const isRetryable404 = e instanceof ApiRequestError && e.status === 404 && attempt < maxAttempts - 1
      if (!isRetryable404) throw e
      await sleep(400 * (attempt + 1))
    }
  }
  throw new Error('Order not found')
}

export function ThankYouPage() {
  const { t } = useI18n()
  const orderId = useParam('orderId')
  const searchParams = useSearchParams()
  const auth = useSnapshot(authStore)
  const [order, setOrder] = useState<ThankYouOrderDTO | null>(null)
  const [recommendations, setRecommendations] = useState<ProductCardDTO[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorRetriable, setErrorRetriable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [retryNonce, setRetryNonce] = useState(0)
  const sessionId = searchParams.get('session_id')
  const paymentIntent = searchParams.get('payment_intent')

  const resolveErrorMessage = useCallback(
    (e: unknown): { message: string; retriable: boolean } => {
      if (e instanceof ApiRequestError) {
        const key = paymentVerifyMessageKey(e.code)
        return {
          message: key ? t(key) : e.userMessage ?? e.message ?? t('paymentResult.fetchError'),
          retriable: isPaymentVerifyRetriable({
            code: e.code,
            status: e.status,
            retriable: e.retriable,
          }),
        }
      }
      return {
        message: e instanceof Error ? e.message : t('paymentResult.fetchError'),
        retriable: false,
      }
    },
    [t],
  )

  useEffect(() => {
    if (!orderId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      setErrorRetriable(false)
      try {
        const hasStripeReturnParams = Boolean(sessionId || paymentIntent)
        if (hasStripeReturnParams) {
          await api.payments.stripeReturn({
            sessionId: sessionId ?? undefined,
            orderId: sessionId ? undefined : orderId,
          })
        }

        let detail = await fetchThankYouOrder(orderId, sessionId)
        if (
          !hasStripeReturnParams &&
          shouldFinalizeStripeOnThankYou({
            hasStripeReturnParams: false,
            paymentMethod: detail.paymentMethod,
          })
        ) {
          await api.payments.stripeReturn({ orderId })
          detail = await fetchThankYouOrder(orderId, sessionId)
        }
        if (cancelled) return
        resetOrdersStore()
        setOrder(detail)

        const paymentSucceeded = isThankYouPaymentSucceeded({
          paymentStatus: detail.paymentStatus,
          orderStatus: detail.orderStatus,
        })
        const bankTransferPlaced =
          detail.paymentMethod === 'bank_transfer' &&
          detail.orderStatus !== 'payment_failed' &&
          detail.orderStatus !== 'cancelled' &&
          detail.orderStatus !== 'abandoned'
        if (bankTransferPlaced || paymentSucceeded) {
          await refreshCartAfterCheckout()
        }

        if (authStore.isAuthenticated && paymentSucceeded) {
          try {
            const recs = await api.orders.recommendations(orderId)
            if (!cancelled) setRecommendations(recs)
          } catch {
            /* opzionale */
          }
        }
      } catch (e) {
        if (!cancelled) {
          const resolved = resolveErrorMessage(e)
          setError(resolved.message)
          setErrorRetriable(resolved.retriable)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [orderId, sessionId, paymentIntent, retryNonce, resolveErrorMessage])

  const isFailed =
    order?.paymentStatus === 'failed' || order?.orderStatus === 'payment_failed'

  if (loading) {
    return (
      <PageLoadTransition isLoading skeleton={<ThankYouPageSkeleton />}>
        {null}
      </PageLoadTransition>
    )
  }
  if (error || !order) {
    return (
      <>
        <ToastOnError message={error ?? t('paymentResult.notFound')} />
        <div className="mx-auto max-w-md py-16 text-center text-sm text-idl-muted">
          <p>{error ?? t('paymentResult.notFound')}</p>
          {errorRetriable ? (
            <button
              type="button"
              className="mt-6 inline-flex items-center justify-center rounded-[10px] bg-idl-amber px-6 py-3 text-[15px] font-extrabold text-white transition hover:brightness-95"
              onClick={() => setRetryNonce((n) => n + 1)}
            >
              {t('paymentResult.retryVerify')}
            </button>
          ) : null}
        </div>
      </>
    )
  }

  if (isFailed) {
    return (
      <PageLoadTransition isLoading={false} skeleton={<ThankYouPageSkeleton />}>
        <PurchaseErrorPageView order={order} />
      </PageLoadTransition>
    )
  }

  return (
    <PageLoadTransition isLoading={false} skeleton={<ThankYouPageSkeleton />}>
      <ThankYouPageView
        order={order}
        recommendations={recommendations}
        isAuthenticated={auth.isAuthenticated}
      />
    </PageLoadTransition>
  )
}
