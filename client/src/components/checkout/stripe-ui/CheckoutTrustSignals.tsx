'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/endpoints'
import type { CartItemDTO, ProductSocialProofEventDTO } from '@/types/dto'
import { formatTimeAgo } from '@/lib/timeAgo'
import { cn } from '@/utils/cn'
import { useI18n } from '@/hooks/use-i18n'

type SummaryTheme = 'light' | 'dark'

type CartItemRef = Pick<CartItemDTO, 'productSlug' | 'productName'>

type SocialProofHighlight = {
  event: ProductSocialProofEventDTO
  productName: string
}

function useCheckoutSocialProof(cartItems?: ReadonlyArray<CartItemRef>) {
  const [highlight, setHighlight] = useState<SocialProofHighlight | null>(null)

  useEffect(() => {
    const slugs = [
      ...new Set(
        cartItems?.map((item) => item.productSlug).filter((slug): slug is string => Boolean(slug)) ?? [],
      ),
    ]
    if (slugs.length === 0) {
      setHighlight(null)
      return
    }

    let cancelled = false
    void (async () => {
      for (const slug of slugs) {
        try {
          const data = await api.catalog.socialProof(slug)
          if (cancelled || !data?.enabled || data.events.length === 0) continue
          const productName =
            data.productName ??
            cartItems?.find((item) => item.productSlug === slug)?.productName ??
            ''
          setHighlight({ event: data.events[0], productName })
          return
        } catch {
          // social proof opzionale
        }
      }
      if (!cancelled) setHighlight(null)
    })()

    return () => {
      cancelled = true
    }
  }, [cartItems])

  return highlight
}

type Props = {
  theme?: SummaryTheme
  cartItems?: ReadonlyArray<CartItemRef>
}

export function CheckoutTrustSignals({ theme = 'light', cartItems }: Props) {
  const { t, tParams } = useI18n()
  const dark = theme === 'dark'
  const socialProof = useCheckoutSocialProof(cartItems)

  function quantityLabel(quantity: number): string {
    return quantity === 1
      ? t('product.socialProof.piece')
      : tParams('product.socialProof.pieces', { count: quantity })
  }

  if (!socialProof) return null

  return (
    <div
      className={cn(
        'border-t pt-5',
        dark ? 'border-white/[0.07]' : 'border-[#e2e6eb]',
      )}
    >
      <div
        className={cn(
          'rounded-lg border px-3.5 py-3',
          dark ? 'border-white/10 bg-white/[0.04]' : 'border-[#e2e6eb] bg-[#f7f8fa]',
        )}
      >
        <p
          className={cn(
            'font-mono text-[9px] font-bold uppercase tracking-[0.14em]',
            dark ? 'text-[#0c0c0d]' : 'text-[#3a3a3d]',
          )}
        >
          {t('checkout.summary.trust.recentActivity')}
        </p>
        <p
          className={cn(
            'mt-1.5 text-[12px] font-semibold leading-snug',
            dark ? 'text-[#f5f5f5]' : 'text-[#14161b]',
          )}
        >
          {tParams('product.socialProof.purchased', {
            buyer: socialProof.event.buyerLabel,
            quantity: quantityLabel(socialProof.event.quantity),
          })}
        </p>
        {socialProof.productName ? (
          <p className={cn('mt-0.5 text-[11px]', dark ? 'text-[#b0b0b4]' : 'text-[#6c727c]')}>
            {socialProof.productName}
          </p>
        ) : null}
        <p className={cn('mt-1 text-[10.5px]', dark ? 'text-[#6f6450]' : 'text-[#9298a3]')}>
          <time dateTime={socialProof.event.purchasedAt}>
            {formatTimeAgo(socialProof.event.purchasedAt)}
          </time>
        </p>
      </div>
    </div>
  )
}
