'use client'

import { useEffect, useState } from 'react'
import { useParam, useSearchParams } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { api } from '@/api/endpoints'
import type { ProductCardDTO, ThankYouOrderDTO } from '@/types/dto'
import { authStore } from '@/features/auth'
import { ToastOnError } from '@/components/ToastFeedback'
import { PurchaseErrorPageView } from '@/components/checkout/purchase-error/PurchaseErrorPageView'
import { ThankYouPageView } from '@/components/checkout/thank-you/ThankYouPageView'
import { ThankYouPageSkeleton } from '@/components/checkout/thank-you/ThankYouPageSkeleton'
import { PageLoadTransition } from '@/components/motion'
import { useI18n } from '@/hooks/use-i18n'

export function ThankYouPage() {
  const { t } = useI18n()
  const orderId = useParam('orderId')
  const searchParams = useSearchParams()
  const auth = useSnapshot(authStore)
  const [order, setOrder] = useState<ThankYouOrderDTO | null>(null)
  const [recommendations, setRecommendations] = useState<ProductCardDTO[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const sessionId = searchParams.get('session_id')
  const paymentIntent = searchParams.get('payment_intent')

  useEffect(() => {
    if (!orderId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (sessionId || paymentIntent) {
          await api.payments.stripeReturn({
            sessionId: sessionId ?? undefined,
            orderId: sessionId ? undefined : orderId,
          })
        } else {
          await api.payments.stripeReturn({ orderId })
        }

        const detail = await api.orders.thankYou(orderId)
        if (cancelled) return
        setOrder(detail)

        const paymentSucceeded =
          detail.paymentStatus === 'captured' ||
          detail.paymentStatus === 'authorized' ||
          detail.orderStatus === 'paid' ||
          detail.orderStatus === 'confirmed' ||
          detail.orderStatus === 'completed' ||
          detail.orderStatus === 'paid_sync_pending' ||
          detail.orderStatus === 'synced'

        if (authStore.isAuthenticated && paymentSucceeded) {
          try {
            const recs = await api.orders.recommendations(orderId)
            if (!cancelled) setRecommendations(recs)
          } catch {
            /* opzionale */
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : t('paymentResult.fetchError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [orderId, sessionId, paymentIntent])

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
          {error ?? t('paymentResult.notFound')}
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
