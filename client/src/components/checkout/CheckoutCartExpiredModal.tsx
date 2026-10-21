'use client'

import { createPortal } from 'react-dom'
import { useEffect } from 'react'
import { useIsClient } from '@/hooks/use-is-client'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { CheckoutActionRow, StripePayButton } from '@/components/checkout/stripe-ui/StripeFields'

type Props = {
  open: boolean
  onBackToCart: () => void
  onBrowseCatalog?: () => void
}

/** Modale a schermo interno: carrello/riserva scaduti durante il checkout. */
export function CheckoutCartExpiredModal({ open, onBackToCart, onBrowseCatalog }: Props) {
  const { t } = useI18n()
  const isClient = useIsClient()

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onBackToCart()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onBackToCart])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !isClient) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex h-[100dvh] w-screen flex-col bg-idl-tech-panel sm:items-center sm:justify-center sm:bg-idl-backdrop sm:p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-cart-expired-title"
        className={cn(
          'flex h-full w-full flex-col bg-idl-tech-panel sm:h-auto sm:max-h-[min(100dvh,480px)] sm:max-w-md sm:overflow-hidden sm:rounded-2xl sm:shadow-xl sm:shadow-idl-ink/10',
        )}
      >
        <div className="flex items-center justify-between border-b border-idl-tech-border px-4 py-3.5 sm:px-6">
          <h2
            id="checkout-cart-expired-title"
            className="text-lg font-extrabold tracking-[-0.01em] text-idl-graphite"
          >
            {t('checkout.cartExpired.title')}
          </h2>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <p className="text-sm leading-relaxed text-idl-muted">{t('checkout.cartExpired.description')}</p>

          <CheckoutActionRow className="mt-auto flex-col sm:mt-8">
            <StripePayButton className="w-full" onClick={onBackToCart}>
              {t('checkout.cartExpired.backToCart')}
            </StripePayButton>
            {onBrowseCatalog ? (
              <button
                type="button"
                onClick={onBrowseCatalog}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold text-idl-muted underline decoration-idl-border underline-offset-2 hover:text-idl-graphite"
              >
                {t('checkout.cartExpired.browseCatalog')}
              </button>
            ) : null}
          </CheckoutActionRow>
        </div>
      </div>
    </div>,
    document.body,
  )
}
