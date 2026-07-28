import type { ProductVariantAttributeDTO } from '@/types/dto'

/** Chip UI adattivi dalla matrice attributi (mai ID Odoo grezzi). */
export function variantAttributeChips(
  attributes: ReadonlyArray<ProductVariantAttributeDTO> | null | undefined,
  fallbackLabel?: string | null,
): string[] {
  if (attributes?.length) {
    return attributes
      .filter((a) => a.name?.trim() && a.value?.trim())
      .map((a) => `${a.name.trim()}: ${a.value.trim()}`)
      .slice(0, 6)
  }
  const label = fallbackLabel?.trim()
  if (label && !/^\d+$/.test(label)) return [label]
  return []
}
