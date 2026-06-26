'use client'

import { useCallback, useEffect, useState } from 'react'
import { ExpressCheckoutElement, useCheckoutElements } from '@stripe/react-stripe-js/checkout'
import type { StripeExpressCheckoutElementConfirmEvent } from '@stripe/stripe-js'
import { useI18n } from '@/hooks/use-i18n'
type Props = {
  orderId: string
  onError?: (message: string) => void
  onAvailableChange?: (available: boolean) => void
  onPaymentSuccess?: (orderId: string) => void
}

export function WalletExpressCheckout({
  orderId,
  onError,
  onAvailableChange,
  onPaymentSuccess,
}: Props) {
  const { t } = useI18n()
  const checkoutState = useCheckoutElements()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (checkoutState.type === 'error') {
      onError?.(checkoutState.error.message)
    }
  }, [checkoutState, onError])

  const confirmCheckout = useCallback(
    async (event: StripeExpressCheckoutElementConfirmEvent) => {
      if (checkoutState.type !== 'success') {
        throw new Error(t('checkout.payment.failed'))
      }
      return checkoutState.checkout.confirm({
        expressCheckoutConfirmEvent: event,
      })
    },
    [checkoutState, orderId, t],
  )

  if (checkoutState.type === 'loading') {
    return (
      <div className="h-11 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
    )
  }

  if (checkoutState.type === 'error') {
    return null
  }

  return (
    <div className={visible ? undefined : 'sr-only'} aria-hidden={!visible}>
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
              googlePay: 'buy',
            },
          } as React.ComponentProps<typeof ExpressCheckoutElement>['options']
        }
        onReady={({ availablePaymentMethods }) => {
          const wallets = availablePaymentMethods
          const hasExpress = Boolean(wallets?.applePay || wallets?.googlePay)
          setVisible(hasExpress)
          onAvailableChange?.(hasExpress)
        }}
        onConfirm={async (event) => {
          const result = await confirmCheckout(event)
          if (result.type === 'error') {
            event.paymentFailed({
              reason: 'fail',
              message: result.error.message ?? t('checkout.payment.failed'),
            })
            onError?.(result.error.message ?? t('checkout.payment.failed'))
            return
          }
          onPaymentSuccess?.(orderId)
        }}
      />
      <p className="sr-only">{orderId}</p>
    </div>
  )
}
