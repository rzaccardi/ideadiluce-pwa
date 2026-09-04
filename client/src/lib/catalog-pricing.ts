import type { ImpersonationInfoDTO, UserDTO } from '@/types/dto'

/** Il listino è risolto dal BFF sulla sessione: il client non deve inviare partner/pricelist. */
export function getCatalogPricingOptions(): {
  partnerId?: number
  pricelistId?: number
} {
  return {}
}

/** True se listing/PDP devono rifare il fetch con cookie (SSR è sempre listino pubblico). */
export function usesSessionPricelist(
  user?: UserDTO | null,
  impersonation?: ImpersonationInfoDTO | null,
): boolean {
  if (impersonation) return true
  if (!user) return false
  return user.customerSegment === 'business' || user.customerSegment === 'professional'
}
