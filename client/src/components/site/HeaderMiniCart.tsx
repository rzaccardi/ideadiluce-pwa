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
import { SITE_PAGE_X_CLASS } from '@/components/site/primitives'
import { useCartSync } from '@/hooks/use-cart-sync'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useTheme } from '@/context/theme-context'
import { formatMoney } from '@/lib/format'
import { cartTotalCents } from '@/lib/cartTotals'
import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import { transitionBase } from '@/lib/motion/presets'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import type { CartDTO, CartStockInsufficientDTO } from '@/types/dto'

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

type CartLike = Omit<CartDTO, 'items' | 'warnings'> & {
  items: ReadonlyArray<CartDTO['items'][number]>
  warnings?: ReadonlyArray<string>
}

type MiniCartPanelProps = {
  cart: CartLike | null
  error: string | null
  isLoading: boolean
  itemCount: number
  total: number | null
  stockInsufficient: readonly CartStockInsufficientDTO[]
  isDark: boolean
  layout: 'dropdown' | 'sheet'
  onClose: () => void
}

function MiniCartPanel({
  cart,
  error,
  isLoading,
  itemCount,
  total,
  stockInsufficient,
  isDark,
  layout,
  onClose,
}: MiniCartPanelProps) {
  const lp = useLocalePath()
  const { t, tParams } = useI18n()
  const isSheet = layout === 'sheet'
  const visibleItems = isSheet ? cart?.items ?? [] : (cart?.items ?? []).slice(0, 4)
  const hiddenCount = isSheet ? 0 : Math.max(0, (cart?.items.length ?? 0) - 4)

  return (
    <>
      <div className={cn('flex items-center justify-between gap-3', isSheet ? 'shrink-0' : undefined)}>
        <h2 className={cn('text-base font-semibold', isDark ? 'text-idl-design-fg' : 'text-idl-graphite')}>
          {t('cart.title')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            ui.interactive,
            'inline-flex shrink-0 items-center justify-center rounded-full',
            isSheet
              ? cn(
                  'size-10 border',
                  isDark
                    ? 'border-white/16 bg-white/6 text-idl-design-fg hover:border-idl-brass hover:text-idl-glow'
                    : 'border-idl-border-strong bg-white text-idl-ink-soft hover:text-idl-ink',
                )
              : cn(
                  'size-8',
                  isDark
                    ? 'text-idl-design-muted hover:bg-white/10 hover:text-idl-design-fg'
                    : 'text-idl-muted hover:bg-idl-cream hover:text-idl-graphite',
                ),
          )}
          aria-label={t('cart.floating.close')}
        >
          <CloseIcon className={isSheet ? 'size-5' : undefined} />
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
        <ul
          className={cn(
            'mt-3 space-y-2',
            isSheet ? 'min-h-0 flex-1 overflow-y-auto pr-0.5' : 'max-h-52 overflow-auto pr-0.5',
          )}
        >
          {visibleItems.map((item) => {
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
                    onClick={onClose}
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
                      onClick={onClose}
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
          {hiddenCount > 0 ? (
            <li className={cn('text-center text-xs', isDark ? 'text-idl-design-subtle' : 'text-idl-muted')}>
              {tParams('cart.floating.moreLines', { count: hiddenCount })}
            </li>
          ) : null}
        </ul>
      ) : (
        <EmptyCartPrompt compact className="mt-4" onNavigate={onClose} />
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {cart && cart.items.length > 0 ? (
        <div className={cn('mt-4', isSheet && 'shrink-0 border-t pt-4', isDark && isSheet ? 'border-white/10' : isSheet ? 'border-idl-border' : undefined)}>
          <Link to={lp('/cart')} onClick={onClose}>
            <Button className="w-full">{t('cart.floating.openCart')}</Button>
          </Link>
        </div>
      ) : null}
    </>
  )
}

type Props = {
  onOpenChange?: (open: boolean) => void
}

export function HeaderMiniCart({ onOpenChange }: Props) {
  const { t } = useI18n()
  const { isDark } = useTheme()
  const reduceMotion = useReducedMotion()
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

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCartOpen(false)
    }
    document.addEventListener('keydown', onKey)

    const mq = window.matchMedia('(max-width: 1023px)')
    const lockScroll = mq.matches
    const prevOverflow = document.body.style.overflow

    const onViewportChange = () => {
      if (!mq.matches) setCartOpen(false)
    }
    mq.addEventListener('change', onViewportChange)

    if (lockScroll) document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onViewportChange)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  const itemCount = cart?.itemCount ?? 0
  const total = cart && cart.items.length > 0 ? cartTotalCents(cart) : null
  const isCartFlow = pathname === '/cart' || pathname.startsWith('/checkout')

  if (isCartFlow) return null

  const panelProps = {
    cart: cart ?? null,
    error,
    isLoading,
    itemCount,
    total,
    stockInsufficient,
    isDark,
    onClose: () => setCartOpen(false),
  }

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
          ui.headerAction,
          isDark
            ? 'border-white/16 bg-white/6 text-idl-design-fg hover:border-idl-brass hover:text-idl-glow'
            : 'border-idl-border-strong bg-white text-idl-ink-soft hover:text-idl-ink',
          isBouncing && 'cart-bounce',
        )}
      >
        <CartIcon className="size-[17px] shrink-0" />
        <span className={ui.headerActionText}>{t('nav.cart')}</span>
        {isLoading && !cart ? (
          <span
            aria-hidden
            className="inline-flex size-[18px] animate-pulse rounded-full bg-idl-border/80"
          />
        ) : itemCount > 0 ? (
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

      <AnimatePresence>
        {open ? (
          <>
            {/* Mobile — bottom sheet quasi fullscreen */}
            <motion.button
              key="mini-cart-backdrop"
              type="button"
              aria-label={t('cart.floating.close')}
              className="fixed inset-0 z-[60] bg-idl-backdrop lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionBase}
              onClick={() => setCartOpen(false)}
            />
            <motion.section
              key="mini-cart-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={t('cart.title')}
              className={cn(
                'fixed inset-x-0 bottom-0 z-[60] flex max-h-[min(96dvh,100%)] flex-col rounded-t-[20px] border-t p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl lg:hidden',
                SITE_PAGE_X_CLASS,
                isDark
                  ? 'border-white/12 bg-idl-design-elevated shadow-black/40'
                  : 'border-idl-border bg-idl-paper shadow-zinc-950/20',
              )}
              initial={reduceMotion ? false : { y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={transitionBase}
            >
              <MiniCartPanel {...panelProps} layout="sheet" />
            </motion.section>

            {/* Desktop — dropdown */}
            <section
              key="mini-cart-dropdown"
              role="dialog"
              aria-label={t('cart.title')}
              className={cn(
                'absolute right-0 top-full z-50 mt-2 hidden w-[min(calc(100vw-2.5rem),380px)] rounded-2xl border p-4 shadow-2xl lg:block',
                isDark
                  ? 'border-white/12 bg-idl-design-elevated shadow-black/40'
                  : 'border-idl-border bg-white shadow-zinc-950/20',
              )}
            >
              <MiniCartPanel {...panelProps} layout="dropdown" />
            </section>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
