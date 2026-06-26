'use client'

import { useEffect, useState } from 'react'
import { Link, useLocation } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { cartStore } from '@/features/cart'
import { cartFeedbackStore } from '@/features/cart/cart-feedback.store'
import { CartLineStockAlert, getCartStockIssue } from '@/components/cart/CartStockAlert'
import { CartFlyIn } from '@/components/cart/CartFlyIn'
import { EmptyCartPrompt } from '@/components/cart/EmptyCartPrompt'
import { CartLineThumb } from '@/components/cart/CartLineThumb'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { useCartSync } from '@/hooks/use-cart-sync'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useTheme } from '@/context/theme-context'
import { formatMoney } from '@/lib/format'
import { cartTotalCents } from '@/lib/cartTotals'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  )
}

type Props = {
  onOpenChange?: (open: boolean) => void
}

export function HeaderMiniCart({ onOpenChange }: Props) {
  const lp = useLocalePath()
  const { t, tParams } = useI18n()
  const { isDark } = useTheme()
  const { cart, error, isLoading, stockInsufficient } = useSnapshot(cartStore)
  const { cartPulse, miniCartOpenRequest } = useSnapshot(cartFeedbackStore)
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const [badgePop, setBadgePop] = useState(false)

  useCartSync()

  const setCartOpen = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

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

  useEffect(() => {
    if (miniCartOpenRequest === 0) return
    setCartOpen(true)
  }, [miniCartOpenRequest])

  const itemCount = cart?.itemCount ?? 0
  const total = cart && cart.items.length > 0 ? cartTotalCents(cart) : null
  const isCartFlow = pathname === '/cart' || pathname.startsWith('/checkout')

  if (isCartFlow) return null

  return (
    <div className="relative">
      <CartFlyIn anchor="header" />
      <button
        type="button"
        onClick={() => setCartOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('cart.floating.openMiniCart')}
        className={cn(
          ui.interactive,
          'inline-flex items-center gap-2 rounded-full border px-[13px] py-2 text-sm font-bold hover:border-idl-brass',
          isDark
            ? 'border-white/16 bg-white/6 text-idl-design-fg hover:text-idl-glow'
            : 'border-idl-border-strong bg-white text-idl-ink-soft hover:text-idl-ink',
          isBouncing && 'cart-bounce',
        )}
      >
        <CartIcon className="size-[17px] shrink-0" />
        <span>{t('nav.cart')}</span>
        {itemCount > 0 ? (
          <span
            className={cn(
              'inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-idl-amber px-1.5 text-[11px] font-bold text-white',
              badgePop && 'cart-badge-pop',
            )}
          >
            {itemCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <section
          role="dialog"
          aria-label={t('cart.title')}
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-[min(calc(100vw-2.5rem),380px)] rounded-2xl border p-4 shadow-2xl',
            isDark
              ? 'border-white/12 bg-idl-design-elevated shadow-black/40'
              : 'border-idl-border bg-white shadow-zinc-950/20',
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className={cn('text-base font-semibold', isDark ? 'text-idl-design-fg' : 'text-idl-graphite')}>
              {t('cart.title')}
            </h2>
            <button
              type="button"
              onClick={() => setCartOpen(false)}
              className={cn(
                ui.interactive,
                'inline-flex size-8 shrink-0 items-center justify-center rounded-full',
                isDark ? 'text-idl-design-muted hover:bg-white/10 hover:text-idl-design-fg' : 'text-idl-muted hover:bg-idl-cream hover:text-idl-graphite',
              )}
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
              <div
                className={cn(
                  'rounded-lg border px-3 py-2.5',
                  isDark ? 'border-white/10 bg-white/5' : 'border-idl-border/60 bg-idl-cream',
                )}
              >
                <dt className={cn('text-xs', isDark ? 'text-idl-design-subtle' : 'text-idl-muted')}>
                  {t('cart.floating.items')}
                </dt>
                <dd className={cn('mt-0.5 text-base font-semibold tabular-nums', isDark ? 'text-idl-design-fg' : 'text-idl-graphite')}>
                  {itemCount}
                </dd>
              </div>
              <div
                className={cn(
                  'rounded-lg border px-3 py-2.5',
                  isDark ? 'border-white/10 bg-white/5' : 'border-idl-border/60 bg-idl-cream',
                )}
              >
                <dt className={cn('text-xs', isDark ? 'text-idl-design-subtle' : 'text-idl-muted')}>
                  {t('cart.floating.estimatedTotal')}
                </dt>
                <dd className={cn('mt-0.5 text-base font-semibold tabular-nums', isDark ? 'text-idl-design-fg' : 'text-idl-graphite')}>
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
                    className={cn(
                      'flex flex-col gap-2 rounded-lg border p-2 text-sm',
                      isDark ? 'border-white/10 bg-white/5' : 'border-idl-border/60 bg-white',
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Link
                        to={lp(`/prodotto/${item.productSlug ?? item.productRef}`)}
                        className="shrink-0"
                        onClick={() => setCartOpen(false)}
                      >
                        <CartLineThumb imageUrl={item.imageUrl} name={item.productName} size="sm" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={lp(`/prodotto/${item.productSlug ?? item.productRef}`)}
                          className={cn(
                            'block truncate font-medium hover:underline',
                            isDark ? 'text-idl-design-fg' : 'text-idl-graphite',
                          )}
                          onClick={() => setCartOpen(false)}
                        >
                          {item.productName ?? item.productSlug ?? item.productRef}
                        </Link>
                        <p className={cn('text-xs', isDark ? 'text-idl-design-subtle' : 'text-idl-muted')}>
                          {tParams('orders.detail.quantity', { count: item.quantity })}
                        </p>
                      </div>
                      {item.lineTotalEstimateCents != null ? (
                        <span className={cn('shrink-0 text-xs font-medium', isDark ? 'text-idl-design-muted' : 'text-idl-ink-soft')}>
                          {formatMoney(item.lineTotalEstimateCents, cart.currencyCode)}
                        </span>
                      ) : null}
                    </div>
                    {stockIssue ? <CartLineStockAlert issue={stockIssue} className="text-xs" /> : null}
                  </li>
                )
              })}
              {cart.items.length > 4 ? (
                <li className={cn('text-center text-xs', isDark ? 'text-idl-design-subtle' : 'text-idl-muted')}>
                  {tParams('cart.floating.moreLines', { count: cart.items.length - 4 })}
                </li>
              ) : null}
            </ul>
          ) : (
            <EmptyCartPrompt compact className="mt-4" onNavigate={() => setCartOpen(false)} />
          )}

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          {cart && cart.items.length > 0 ? (
            <div className="mt-4">
              <Link to={lp('/cart')} onClick={() => setCartOpen(false)}>
                <Button className="w-full">{t('cart.floating.openCart')}</Button>
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
