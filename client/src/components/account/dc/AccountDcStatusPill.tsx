import type { OrderStatusTone } from '@/lib/orderLabels'
import { cn } from '@/utils/cn'

const toneClass: Record<OrderStatusTone, string> = {
  success: 'bg-[#e8f6ee] text-[#1f9d57]',
  warning: 'bg-[#fdf3e0] text-[#c98a00]',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-[#f0f2f5] text-[#6c727c]',
}

export function AccountDcStatusPill({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: OrderStatusTone
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-[11px] font-bold',
        toneClass[tone],
      )}
    >
      ● {label}
    </span>
  )
}
