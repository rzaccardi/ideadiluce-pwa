import type { CartItemDTO } from '@/types/dto'
import type { MessageKey } from '@/i18n/messages'

export type CartLineAvailabilityTone = 'available' | 'limited' | 'unavailable'

export function getCartLineAvailabilityDisplay(line: CartItemDTO): {
  tone: CartLineAvailabilityTone
  messageKey: MessageKey
  params?: Record<string, string | number>
} {
  const blocked = line.availabilityStatus === 'blocked' || line.purchasable === false
  if (blocked) {
    return { tone: 'unavailable', messageKey: 'cart.line.unavailable' }
  }

  const stockQty = line.availability.stockQty
  if (line.availabilityStatus === 'limited' && stockQty != null && stockQty > 0) {
    return {
      tone: 'limited',
      messageKey: 'cart.line.lowStock',
      params: { qty: stockQty },
    }
  }

  const leadDays = line.availability.effectiveLeadDays
  if (leadDays != null && leadDays > 0 && leadDays <= 2) {
    return { tone: 'available', messageKey: 'cart.line.availableFast' }
  }

  if (leadDays != null && leadDays > 2) {
    return {
      tone: 'available',
      messageKey: 'cart.line.availableLead',
      params: { days: leadDays },
    }
  }

  if (line.availability.state === 'orderable') {
    return { tone: 'limited', messageKey: 'cart.line.orderable' }
  }

  return { tone: 'available', messageKey: 'cart.line.availableFast' }
}

export function cartLineVariantChips(line: CartItemDTO): string[] {
  if (!line.variantRef?.trim()) return []
  const parts = line.variantRef
    .split(/[,|/]/)
    .map((part) => part.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.slice(0, 4) : [line.variantRef.trim()]
}

const toneClass: Record<CartLineAvailabilityTone, string> = {
  available: 'text-[#1f9d57]',
  limited: 'text-[#c98a00]',
  unavailable: 'text-red-700',
}

export function cartLineAvailabilityToneClass(tone: CartLineAvailabilityTone): string {
  return toneClass[tone]
}
