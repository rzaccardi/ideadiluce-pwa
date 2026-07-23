'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from '@/lib/navigation'
import { useSnapshot } from 'valtio/react'
import { cartStore } from '@/features/cart'
import { isCartFlowPath, isCartPagePath } from '@/features/cart/cart.utils'
import { cartFeedbackStore } from '@/features/cart/cart-feedback.store'
import { CartLineStockAlert, getCartStockIssue } from '@/components/cart/CartStockAlert'
import { CartFlyIn } from '@/components/cart/CartFlyIn'
import { EmptyCartPrompt } from '@/components/cart/EmptyCartPrompt'
import { CartLineThumb } from '@/components/cart/CartLineThumb'
import { Button } from '@/components/Button'
import { Skeleton } from '@/components/Skeleton'
import { SITE_PAGE_X_CLASS } from '@/components/site/primitives'
import { useCartSync } from '@/hooks/use-cart-sync'
import { useIsClient } from '@/hooks/use-is-client'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'
import { formatMoney } from '@/lib/format'
import { cartTotalCents } from '@/lib/cartTotals'
import { AnimatePresence, motion, useReducedMotion } from '@/lib/motion-client'
import { transitionBase } from '@/lib/motion/presets'
import { cn } from '@/utils/cn'
import { ui } from '@/lib/ui-classes'
import { layers } from '@/lib/layering'
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
        <h2 className="text-base font-semibold text-idl-graphite">{t('cart.title')}</h2>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            ui.interactive,
            'inline-flex shrink-0 items-center justify-center rounded-full',
            isSheet
              ? cn(ui.mobileMenuClose, 'size-10')
              : 'size-8 text-idl-muted hover:bg-idl-cream hover:text-idl-graphite',
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
          <div className="rounded-lg border border-idl-border/60 bg-idl-tech-panel px-3 py-2.5">
            <dt className="text-xs text-idl-muted">{t('cart.floating.items')}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-idl-graphite">{itemCount}</dd>
          </div>
          <div className="rounded-lg border border-idl-border/60 bg-idl-tech-panel px-3 py-2.5">
            <dt className="text-xs text-idl-muted">{t('cart.floating.estimatedTotal')}</dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-idl-graphite">
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
                className="flex flex-col gap-2 rounded-lg border border-idl-border/60 bg-idl-tech-panel p-2 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Link
                    to={lp(`/prodotto/${item.productSlug ?? item.productRef}`)}
                    className="shrink-0"
                  >
                    <CartLineThumb imageUrl={item.imageUrl} name={item.productName} size="sm" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={lp(`/prodotto/${item.productSlug ?? item.productRef}`)}
                      className="block truncate font-medium text-idl-graphite hover:underline"
                    >
                      {item.productName ?? item.productSlug ?? item.productRef}
                    </Link>
                    <p className="text-xs text-idl-muted">
                      {tParams('orders.detail.quantity', { count: item.quantity })}
                    </p>
                  </div>
                  {item.lineTotalEstimateCents != null ? (
                    <span className="shrink-0 text-xs font-medium text-idl-ink-soft">
                      {formatMoney(item.lineTotalEstimateCents, cart.currencyCode)}
                    </span>
                  ) : null}
                </div>
                {stockIssue ? <CartLineStockAlert issue={stockIssue} className="text-xs" /> : null}
              </li>
            )
          })}
          {hiddenCount > 0 ? (
            <li className="text-center text-xs text-idl-muted">
              {tParams('cart.floating.moreLines', { count: hiddenCount })}
            </li>
          ) : null}
        </ul>
      ) : (
        <EmptyCartPrompt compact className="mt-4" />
      )}

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      {cart && cart.items.length > 0 ? (
        <div className={cn('mt-4', isSheet && 'shrink-0 border-t border-idl-border pt-4')}>
          <Link to={lp('/cart')}>
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
  const isClient = useIsClient()
  const reduceMotion = useReducedMotion()
  const { cart, error, isLoading, stockInsufficient } = useSnapshot(cartStore)
  const { cartPulse, miniCartOpenRequest } = useSnapshot(cartFeedbackStore)
  const { pathname } = useLocation()
  const isCartFlow = isCartFlowPath(pathname)
  const isCartPage = isCartPagePath(pathname)
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const isCartPageDesktop = isCartPage && isDesktop
  const [open, setOpen] = useState(false)
  const [isBouncing, setIsBouncing] = useState(false)
  const [badgePop, setBadgePop] = useState(false)

  useCartSync(isCartFlow || open, { pollStock: !isCartPage })

  const setCartOpen = (value: boolean) => {
    setOpen(value)
    onOpenChange?.(value)
  }

  useEffect(() => {
    setCartOpen(false)
  }, [pathname])

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

  // Checkout: nascosto ovunque. Pagina carrello: nascosto su mobile via CSS (evita branch SSR su viewport).
  if (isCartFlow && !isCartPage) return null

  const panelProps = {
    cart: cart ?? null,
    error,
    isLoading,
    itemCount,
    total,
    stockInsufficient,
    onClose: () => setCartOpen(false),
  }
  const showMiniCart = open && !isCartPageDesktop

  return (
    <div className={cn('relative', isCartPage && 'hidden lg:block')}>
      <CartFlyIn anchor="header" />
      <button
        type="button"
        onClick={isCartPageDesktop ? undefined : () => setCartOpen(!open)}
        aria-expanded={isCartPageDesktop ? undefined : open}
        aria-haspopup={isCartPageDesktop ? undefined : 'dialog'}
        aria-current={isCartPageDesktop ? 'page' : undefined}
        aria-label={isCartPageDesktop ? t('nav.cart') : t('cart.floating.openMiniCart')}
        className={cn(
          ui.interactive,
          cn(
            ui.headerAction,
            ui.headerActionBtn,
            'relative lg:gap-1.5 lg:px-3 lg:py-1.5 lg:text-[13px]',
            isCartPageDesktop && 'cursor-default border-idl-brass text-idl-brass',
            isBouncing && !isCartPageDesktop && 'cart-bounce',
          ),
        )}
      >
        <CartIcon className="size-[17px] shrink-0 lg:size-4" />
        <span className={ui.headerActionText}>{t('nav.cart')}</span>
        {itemCount > 0 ? (
          <span
            className={cn(
              'absolute bottom-0 right-0 inline-flex min-h-[18px] min-w-[18px] translate-x-1/4 translate-y-1/4 items-center justify-center rounded-full bg-idl-amber px-1.5 text-[11px] font-bold text-white dark:text-idl-design lg:static lg:translate-x-0 lg:translate-y-0',
              badgePop && 'cart-badge-pop',
            )}
          >
            {itemCount}
          </span>
        ) : null}
      </button>

      {isClient
        ? createPortal(
            <AnimatePresence>
              {showMiniCart ? (
                <>
                  <motion.button
                    key="mini-cart-backdrop"
                    type="button"
                    aria-label={t('cart.floating.close')}
                    className={cn(
                      'fixed inset-0 h-[100dvh] w-screen bg-idl-backdrop lg:hidden',
                      layers.sheetBackdrop,
                    )}
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
                      'fixed inset-x-0 bottom-0 flex max-h-[min(96dvh,100%)] flex-col rounded-t-[20px] border border-idl-border border-t bg-idl-paper p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl shadow-zinc-950/20 lg:hidden',
                      layers.sheet,
                      SITE_PAGE_X_CLASS,
                    )}
                    initial={reduceMotion ? false : { y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={transitionBase}
                  >
                    <MiniCartPanel {...panelProps} layout="sheet" />
                  </motion.section>
                </>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}

      <AnimatePresence>
        {showMiniCart ? (
          <section
            key="mini-cart-dropdown"
            role="dialog"
            aria-label={t('cart.title')}
            className={cn(
              'absolute right-0 top-full mt-2 hidden w-[min(calc(100vw-2.5rem),380px)] rounded-2xl border border-idl-border bg-idl-tech-panel p-4 shadow-2xl shadow-zinc-950/20 lg:block',
              layers.headerDropdown,
            )}
          >
            <MiniCartPanel {...panelProps} layout="dropdown" />
          </section>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
