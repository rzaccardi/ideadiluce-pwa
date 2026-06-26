'use client'

import { useEffect, useState } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { cartStore, fetchCart, useCartReservationSync, useCartStockPolling } from '@/features/cart'
import { fetchWishlist } from '@/features/wishlist'
import { CartLineStockAlert, getCartStockIssue } from '@/components/cart/CartStockAlert'
import { cartFeedbackStore } from '@/features/cart/cart-feedback.store'
import { formatMoney } from '@/lib/format'
import { cartTotalCents } from '@/lib/cartTotals'
import { cn } from '@/utils/cn'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { CartActivityToasts } from '@/components/cart/CartActivityToasts'
import { CartFlyIn } from '@/components/cart/CartFlyIn'
import { EmptyCartPrompt } from '@/components/cart/EmptyCartPrompt'
import { CartLineThumb } from '@/components/cart/CartLineThumb'
import { useI18n } from '@/hooks/use-i18n'

const POLL_MS = 30_000

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

function FloatingCartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn('h-5 w-5', className)} fill="none">
      <path
        d="M6.5 6.5h14l-1.4 7.2a2 2 0 0 1-2 1.6H9.3a2 2 0 0 1-2-1.7L6.1 4.8H3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function FloatingCartMonitor() {
  const { t, tParams } = useI18n()
  const { cart, error, isLoading, stockInsufficient } = useSnapshot(cartStore)
  useCartStockPolling()
  useCartReservationSync()
  const { cartPulse } = useSnapshot(cartFeedbackStore)
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const [badgePop, setBadgePop] = useState(false)

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) {
        void fetchCart()
        void fetchWishlist()
      }
    }

    const onVisibilityChange = () => {
      if (!document.hidden) refresh()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibilityChange)
    const intervalId = window.setInterval(refresh, POLL_MS)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    if (cartPulse === 0) return
    setIsBouncing(true)
    setBadgePop(true)
    const timer = window.setTimeout(() => {
      setIsBouncing(false)
      setBadgePop(false)
    }, 600)
    return () => window.clearTimeout(timer)
  }, [cartPulse])

  const itemCount = cart?.itemCount ?? 0
  const total = cart && cart.items.length > 0 ? cartTotalCents(cart) : null
  const isCartFlow = pathname === '/cart' || pathname.startsWith('/checkout')

  if (isCartFlow) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <CartActivityToasts />

      {isOpen ? (
        <section className="w-[min(calc(100vw-2.5rem),380px)] rounded-2xl border border-idl-border bg-white p-4 shadow-2xl shadow-zinc-950/20">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-idl-graphite">{t('cart.title')}</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-idl-muted transition hover:bg-idl-cream hover:text-idl-graphite"
              aria-label={t('cart.floating.close')}
            >
              <CloseIcon />
            </button>
          </div>

          {isLoading && !cart ? (
            <div className="mt-3 grid grid-cols-2 gap-3" role="status">
              <span className="sr-only">{t('cart.floating.loading')}</span>
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : (
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-idl-border/60 bg-idl-cream px-3 py-2.5">
                <dt className="text-xs text-idl-muted">{t('cart.floating.items')}</dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums text-idl-graphite">
                  {itemCount}
                </dd>
              </div>
              <div className="rounded-lg border border-idl-border/60 bg-idl-cream px-3 py-2.5">
                <dt className="text-xs text-idl-muted">{t('cart.floating.estimatedTotal')}</dt>
                <dd className="mt-0.5 text-base font-semibold tabular-nums text-idl-graphite">
                  {cart && total != null ? formatMoney(total, cart.currencyCode) : '—'}
                </dd>
              </div>
            </dl>
          )}

          {cart && cart.items.length > 0 ? (
            <ul className="mt-3 max-h-52 space-y-2 overflow-auto pr-0.5">
              {cart.items.slice(0, 4).map((item) => {
                const stockIssue = getCartStockIssue(item.productRef, stockInsufficient)
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-2 rounded-lg border border-idl-border/60 bg-white p-2 text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <Link
                        to={`/prodotto/${item.productSlug ?? item.productRef}`}
                        className="shrink-0"
                        onClick={() => setIsOpen(false)}
                      >
                        <CartLineThumb
                          imageUrl={item.imageUrl}
                          name={item.productName}
                          size="sm"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/prodotto/${item.productSlug ?? item.productRef}`}
                          className="block truncate font-medium text-idl-graphite hover:underline"
                          onClick={() => setIsOpen(false)}
                        >
                          {item.productName ?? item.productSlug ?? item.productRef}
                        </Link>
                        <p className="text-xs text-idl-muted">{tParams('orders.detail.quantity', { count: item.quantity })}</p>
                      </div>
                      {item.lineTotalEstimateCents != null ? (
                        <span className="shrink-0 text-xs font-medium text-idl-ink-soft">
                          {formatMoney(item.lineTotalEstimateCents, cart.currencyCode)}
                        </span>
                      ) : null}
                    </div>
                    {stockIssue ? (
                      <CartLineStockAlert issue={stockIssue} className="text-xs" />
                    ) : null}
                  </li>
                )
              })}
              {cart.items.length > 4 ? (
                <li className="text-center text-xs text-idl-muted">
                  {tParams('cart.floating.moreLines', { count: cart.items.length - 4 })}
                </li>
              ) : null}
            </ul>
          ) : (
            <EmptyCartPrompt compact className="mt-4" onNavigate={() => setIsOpen(false)} />
          )}

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          {cart && cart.items.length > 0 ? (
            <div className="mt-4">
              <Link to="/cart" onClick={() => setIsOpen(false)}>
                <Button className="w-full">{t('cart.floating.openCart')}</Button>
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="relative">
        <CartFlyIn />
        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className={cn(
            'relative inline-flex items-center gap-2 rounded-full bg-idl-ink px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-zinc-950/20 transition hover:bg-idl-ink-soft',
            isBouncing && 'cart-bounce',
          )}
          aria-expanded={isOpen}
          aria-label={t('cart.floating.openMiniCart')}
        >
          <FloatingCartIcon />
          <span>{t('cart.title')}</span>
          {itemCount > 0 ? (
            <span
              className={cn(
                'rounded-full bg-white px-2 py-0.5 text-xs text-idl-graphite',
                badgePop && 'cart-badge-pop',
              )}
            >
              {itemCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  )
}
