'use client'

import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'

type Props = {
  deliveryLeadDays: number | null
  className?: string
}

export function CartDeliveryBanner({ deliveryLeadDays, className }: Props) {
  const { tParams } = useI18n()
  if (deliveryLeadDays == null || deliveryLeadDays <= 0) return null

  return (
    <div
      className={cn(
        'rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950',
        className,
      )}
      role="status"
    >
      {tParams('cart.delivery.banner', { days: deliveryLeadDays })}
    </div>
  )
}
