import { cn } from '@/utils/cn'
import type { OrderStatusTone } from '@/lib/orderLabels'

const toneClass: Record<OrderStatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  warning: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  danger: 'bg-red-50 text-red-800 ring-red-200/80',
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200/80',
}

export function AccountStatusBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: OrderStatusTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        toneClass[tone],
      )}
    >
      {label}
    </span>
  )
}
