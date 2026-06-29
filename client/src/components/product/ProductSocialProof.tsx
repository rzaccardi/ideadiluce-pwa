'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/endpoints'
import type { ProductSocialProofDTO } from '@/types/dto'
import { formatTimeAgo } from '@/lib/timeAgo'
import { useI18n } from '@/hooks/use-i18n'

const FIRST_SHOW_MS = 2_500
const ROTATE_MS = 7_000

function PurchaseIcon() {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path
          d="M9 12.5 11 14.5 15.5 10"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M6.5 6.5h14l-1.4 7.2a2 2 0 0 1-2 1.6H9.3a2 2 0 0 1-2-1.7L6.1 4.8H3.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  )
}

type Props = {
  slug: string
  productName: string
}

function useSocialProof(slug: string) {
  const [data, setData] = useState<ProductSocialProofDTO | null>(null)

  useEffect(() => {
    let cancelled = false
    void api.catalog
      .socialProof(slug)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [slug])

  return data
}

/** Elenco acquisti recenti nel tab Attività. */
export function ProductSocialProofPanel({ slug, productName }: Props) {
  const { t, tParams } = useI18n()
  const data = useSocialProof(slug)
  const events = data?.enabled ? data.events : []
  const minHint =
    data?.minQuantity != null && data.minQuantity > 1
      ? tParams('product.socialProof.minQuantityHint', { count: data.minQuantity })
      : ''

  function quantityLabel(n: number): string {
    return n === 1 ? t('product.socialProof.piece') : tParams('product.socialProof.pieces', { count: n })
  }

  if (!data?.enabled) {
    return <p className="text-sm text-idl-muted">{t('product.socialProof.disabled')}</p>
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-idl-muted">
        {t('product.socialProof.noEvents')}
        {minHint}.
      </p>
    )
  }

  return (
    <ul className="space-y-3">
      {events.map((event) => (
        <li
          key={`${event.purchasedAt}-${event.buyerLabel}`}
          className="flex gap-3 rounded-lg border border-idl-border bg-idl-cream/50 px-4 py-3"
        >
          <PurchaseIcon />
          <div className="min-w-0">
            <p className="text-sm text-idl-ink-soft">
              {tParams('product.socialProof.purchased', {
                buyer: event.buyerLabel,
                quantity: quantityLabel(event.quantity),
              })}
            </p>
            <p className="mt-0.5 text-xs text-idl-muted">{data.productName ?? productName}</p>
            <p className="mt-1 text-xs text-idl-placeholder">
              <time dateTime={event.purchasedAt}>{formatTimeAgo(event.purchasedAt)}</time>
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Notifiche acquisti in basso a destra (stile Ticketone). */
export function ProductSocialProofNotifications({ slug, productName }: Props) {
  const { t, tParams } = useI18n()
  const data = useSocialProof(slug)
  const [index, setIndex] = useState(0)
  const [active, setActive] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const events = data?.enabled ? data.events : []

  function quantityLabel(n: number): string {
    return n === 1 ? t('product.socialProof.piece') : tParams('product.socialProof.pieces', { count: n })
  }

  useEffect(() => {
    setActive(false)
    setDismissed(false)
    setIndex(0)
  }, [slug])

  useEffect(() => {
    if (events.length === 0 || dismissed) return

    const showTimer = window.setTimeout(() => setActive(true), FIRST_SHOW_MS)
    const rotateTimer = window.setInterval(() => {
      setIndex((i) => (i + 1) % events.length)
    }, ROTATE_MS)

    return () => {
      window.clearTimeout(showTimer)
      window.clearInterval(rotateTimer)
    }
  }, [events.length, dismissed, slug])

  if (!active || events.length === 0 || dismissed) return null

  const event = events[index % events.length]
  const displayName = data?.productName ?? productName
  const qty = quantityLabel(event.quantity)

  return (
    <div
      className="pointer-events-none fixed bottom-24 right-4 z-[45] flex max-w-[min(calc(100vw-2rem),340px)] justify-end sm:right-6"
      role="status"
      aria-live="polite"
    >
      <div
        key={`${event.purchasedAt}-${index}`}
        className="social-proof-enter pointer-events-auto w-full rounded-xl border border-idl-border/90 bg-idl-tech-panel p-3.5 shadow-xl shadow-zinc-950/15"
      >
        <div className="flex gap-3">
          <PurchaseIcon />
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-snug text-idl-ink-soft">
              {tParams('product.socialProof.purchased', {
                buyer: event.buyerLabel,
                quantity: qty,
              })}
            </p>
            <p className="mt-0.5 truncate text-xs text-idl-muted">{displayName}</p>
            <p className="mt-1 text-xs text-idl-placeholder">
              <time dateTime={event.purchasedAt}>{formatTimeAgo(event.purchasedAt)}</time>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded-full p-1 text-idl-placeholder hover:bg-idl-cream hover:text-idl-ink-soft"
            aria-label={t('product.socialProof.closeNotifications')}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

/** Alias toast floating — notifiche acquisti in basso a destra. */
export const ProductSocialProofToast = ProductSocialProofNotifications
