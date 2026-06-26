'use client'

import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import {
  ExpressCheckoutElement,
  PaymentElement,
  useCheckoutElements,
} from '@stripe/react-stripe-js/checkout'
import type {
  StripeCheckoutContact,
  StripeExpressCheckoutElementConfirmEvent,
} from '@stripe/stripe-js'
import { useSnapshot } from 'valtio/react'
import { checkoutStore } from '@/features/checkout'
import { StripeDivider, StripeFieldGroup, StripeFieldLabel, StripeInput } from './stripe-ui/StripeFields'
import { useI18n } from '@/hooks/use-i18n'

function formatCardholderName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
}

function buildConfirmBillingDetails(cardholderName: string): {
  email?: string
  phoneNumber?: string
  billingAddress: StripeCheckoutContact
} {
  const draft = checkoutStore.draft
  const addr = draft.billingSameAsShipping ? draft.shipping : draft.billing
  return {
    email: draft.email.trim() || undefined,
    phoneNumber: addr.phone?.trim() || undefined,
    billingAddress: {
      name: cardholderName.trim(),
      address: {
        country: addr.country,
        line1: addr.line1,
        line2: addr.line2 || null,
        city: addr.city,
        postal_code: addr.postalCode,
      },
    },
  }
}

export type StripePaymentFormHandle = {
  pay: () => Promise<void>
  ready: boolean
}

type Props = {
  orderId: string
  onError: (message: string) => void
  onReadyChange?: (ready: boolean) => void
  onBeforeConfirm?: () => Promise<void>
  onPaymentSuccess?: (orderId: string) => void
}

export const StripePaymentForm = forwardRef<StripePaymentFormHandle, Props>(function StripePaymentForm(
  { orderId, onError, onReadyChange, onBeforeConfirm, onPaymentSuccess },
  ref,
) {
  const { t, tParams } = useI18n()
  const checkout = useSnapshot(checkoutStore)
  const checkoutState = useCheckoutElements()
  const [busy, setBusy] = useState(false)
  const [expressAvailable, setExpressAvailable] = useState(false)
  const [paymentReady, setPaymentReady] = useState(false)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [cardholderName, setCardholderName] = useState('')

  const billingAddr = checkout.draft.billingSameAsShipping
    ? checkout.draft.shipping
    : checkout.draft.billing
  const suggestedCardholderName = formatCardholderName(billingAddr.firstName, billingAddr.lastName)

  useEffect(() => {
    if (!cardholderName.trim() && suggestedCardholderName) {
      setCardholderName(suggestedCardholderName)
    }
  }, [suggestedCardholderName, cardholderName])

  const checkoutReady = checkoutState.type === 'success'
  const cardholderReady = cardholderName.trim().length > 0
  const ready = checkoutReady && paymentReady && paymentComplete && cardholderReady

  useEffect(() => {
    onReadyChange?.(ready)
  }, [ready, onReadyChange])

  useEffect(() => {
    if (checkoutState.type === 'error') {
      onError(checkoutState.error.message)
    }
  }, [checkoutState, onError])

  const confirmCheckout = useCallback(
    async (expressCheckoutConfirmEvent?: StripeExpressCheckoutElementConfirmEvent) => {
      if (checkoutState.type !== 'success') {
        throw new Error(t('checkout.payment.failed'))
      }
      const name = cardholderName.trim()
      if (!name) {
        throw new Error(t('checkout.payment.cardholderNameRequired'))
      }
      return checkoutState.checkout.confirm({
        ...buildConfirmBillingDetails(name),
        ...(expressCheckoutConfirmEvent ? { expressCheckoutConfirmEvent } : {}),
      })
    },
    [checkoutState, cardholderName, orderId, t],
  )

  const pay = useCallback(async () => {
    if (!checkoutReady) {
      onError(t('checkout.payment.formNotReady'))
      return
    }
    if (!paymentComplete) {
      onError(t('checkout.payment.cardIncomplete'))
      return
    }
    if (!cardholderName.trim()) {
      onError(t('checkout.payment.cardholderNameRequired'))
      return
    }
    setBusy(true)
    onError('')
    try {
      try {
        await onBeforeConfirm?.()
      } catch {
        onError(t('checkout.payment.prepareError'))
        return
      }
      const result = await confirmCheckout()
      if (result.type === 'error') {
        onError(result.error.message ?? t('checkout.payment.failed'))
        return
      }
      onPaymentSuccess?.(orderId)
    } catch (e) {
      onError(e instanceof Error ? e.message : t('checkout.payment.failed'))
    } finally {
      setBusy(false)
    }
  }, [
    checkoutReady,
    paymentComplete,
    cardholderName,
    onError,
    onBeforeConfirm,
    confirmCheckout,
    onPaymentSuccess,
    orderId,
    t,
  ])

  useImperativeHandle(
    ref,
    () => ({
      ready,
      pay,
    }),
    [ready, pay],
  )

  if (checkoutState.type === 'loading') {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-500">
        {t('checkout.processing')}
      </div>
    )
  }

  if (checkoutState.type === 'error') {
    return (
      <p className="text-sm text-[#df1b41]">{checkoutState.error.message}</p>
    )
  }

  return (
    <div className={busy ? 'pointer-events-none opacity-70' : undefined}>
      <ExpressCheckoutElement
        options={
          {
            paymentMethods: {
              applePay: 'always',
              googlePay: 'always',
              link: 'never',
            },
            layout: { maxColumns: 2, maxRows: 1 },
            buttonType: {
              applePay: 'buy',
              googlePay: 'pay',
            },
          } as React.ComponentProps<typeof ExpressCheckoutElement>['options']
        }
        onReady={({ availablePaymentMethods }) => {
          const wallets = availablePaymentMethods
          const hasExpress = Boolean(wallets?.applePay || wallets?.googlePay)
          setExpressAvailable(hasExpress)
        }}
        onConfirm={async (event) => {
          if (!cardholderName.trim()) {
            event.paymentFailed({
              reason: 'fail',
              message: t('checkout.payment.cardholderNameRequired'),
            })
            onError(t('checkout.payment.cardholderNameRequired'))
            return
          }
          if (!paymentComplete) {
            event.paymentFailed({
              reason: 'fail',
              message: t('checkout.payment.cardIncomplete'),
            })
            onError(t('checkout.payment.cardIncomplete'))
            return
          }
          setBusy(true)
          onError('')
          try {
            await onBeforeConfirm?.()
            const result = await confirmCheckout(event)
            if (result.type === 'error') {
              event.paymentFailed({
                reason: 'fail',
                message: result.error.message ?? t('checkout.payment.failed'),
              })
              onError(result.error.message ?? t('checkout.payment.failed'))
              return
            }
            onPaymentSuccess?.(orderId)
          } catch (e) {
            const message = e instanceof Error ? e.message : t('checkout.payment.failed')
            event.paymentFailed({ reason: 'fail', message })
            onError(message)
          } finally {
            setBusy(false)
          }
        }}
      />

      {expressAvailable ? <StripeDivider label={t('checkout.payment.orPayWithCard')} /> : null}

      <div className="mb-3">
        <StripeFieldLabel htmlFor="cardholder-name">{t('checkout.payment.cardholderName')}</StripeFieldLabel>
        <StripeFieldGroup>
          <StripeInput
            id="cardholder-name"
            name="cardholder-name"
            autoComplete="cc-name"
            placeholder={t('checkout.payment.cardholderNamePlaceholder')}
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
          />
        </StripeFieldGroup>
      </div>

      <PaymentElement
        onReady={() => setPaymentReady(true)}
        onChange={(event) => setPaymentComplete(event.complete)}
        options={{
          layout: 'tabs',
          wallets: {
            link: 'never',
          },
          fields: {
            billingDetails: {
              name: 'never',
              email: 'never',
              phone: 'never',
              address: 'never',
            },
          },
        }}
      />
      <p className="sr-only">{tParams('checkout.payment.orderSr', { orderId })}</p>
    </div>
  )
})
