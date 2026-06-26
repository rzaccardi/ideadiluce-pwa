'use client'

import { useSnapshot } from 'valtio/react'
import { dismissCartToast, requestOpenMiniCart } from '@/features/cart/cart-feedback'
import { cartFeedbackStore } from '@/features/cart/cart-feedback.store'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

function CartToastIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-600" fill="none">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-4 w-4', className)} fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export function CartActivityToasts({ className }: { className?: string }) {
  const { t } = useI18n()
  const { toasts } = useSnapshot(cartFeedbackStore)

  if (toasts.length === 0) return null

  return (
    <div className={cn('flex w-[min(calc(100vw-2.5rem),380px)] flex-col gap-2', className)} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="cart-toast-enter flex items-center gap-3 rounded-xl border border-idl-border bg-white p-3 shadow-lg shadow-zinc-950/10"
        >
          <button
            type="button"
            onClick={() => {
              requestOpenMiniCart()
              dismissCartToast(toast.id)
            }}
            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left transition hover:opacity-80"
            aria-label={t('cart.toast.openCart')}
          >
            {toast.imageUrl ? (
              <img
                src={toast.imageUrl}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-zinc-100"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-idl-cream text-xs text-idl-placeholder">
                —
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-medium text-idl-graphite">
                <CartToastIcon />
                {t('cart.toast.added')}
              </p>
              <p className="truncate text-sm text-idl-muted">{toast.productName}</p>
              {toast.quantity > 1 ? (
                <p className="text-xs text-idl-muted">
                  {t('cart.toast.quantity')} {toast.quantity}
                </p>
              ) : null}
            </div>
          </button>
          <button
            type="button"
            onClick={() => dismissCartToast(toast.id)}
            className="shrink-0 rounded-full p-1 text-idl-placeholder hover:bg-idl-cream hover:text-idl-ink-soft"
            aria-label={t('cart.toast.close')}
          >
            <CloseIcon />
          </button>
        </div>
      ))}
    </div>
  )
}
