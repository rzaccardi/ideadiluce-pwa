'use client'

import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  className?: string
}

export function ProductTrustBadges({ className }: Props) {
  const { t } = useI18n()

  const badges = [
    {
      title: t('product.trust.secureTitle'),
      description: t('product.trust.secureDescription'),
    },
    {
      title: t('product.trust.freeShippingTitle'),
      description: t('product.trust.freeShippingDescription'),
    },
    {
      title: t('product.trust.refundTitle'),
      description: t('product.trust.refundDescription'),
    },
  ] as const

  return (
    <ul className={cn('grid gap-4 sm:grid-cols-3', className)}>
      {badges.map((badge) => (
        <li
          key={badge.title}
          className="rounded-lg border border-idl-border bg-idl-cream/80 px-4 py-3 text-left"
        >
          <p className="text-sm font-semibold text-idl-graphite">{badge.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-idl-muted">{badge.description}</p>
        </li>
      ))}
    </ul>
  )
}
