import type { CartLineBlockReasonDTO, CartLineAvailabilityStatusDTO } from '../../types/dto.js'

export function resolveCartLineAvailabilityStatus(input: {
  purchasable: boolean
  productResolved: boolean
  unitCents: number | null
  state: 'available' | 'orderable' | 'out_of_stock'
  warning: string | null
}): {
  availabilityStatus: CartLineAvailabilityStatusDTO
  blockReason?: CartLineBlockReasonDTO
} {
  if (!input.productResolved) {
    return { availabilityStatus: 'blocked', blockReason: 'discontinued' }
  }
  if (!input.purchasable) {
    if (input.unitCents == null) {
      return { availabilityStatus: 'blocked', blockReason: 'price_unavailable' }
    }
    return { availabilityStatus: 'blocked', blockReason: 'out_of_stock' }
  }
  if (input.warning) {
    return { availabilityStatus: 'limited' }
  }
  return { availabilityStatus: 'available' }
}
