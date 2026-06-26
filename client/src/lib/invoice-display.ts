import type { OrderStatusTone } from '@/lib/orderLabels'

export function invoiceStateTone(state: string): OrderStatusTone {
  const key = state.toLowerCase()
  if (key === 'posted' || key === 'paid') return 'success'
  if (key === 'draft') return 'warning'
  if (key === 'cancel') return 'danger'
  return 'neutral'
}
