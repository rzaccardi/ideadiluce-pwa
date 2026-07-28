import type { ProductVariantAttributeDTO } from '../../types/dto.js'

/** Snapshot variante salvato su CartItem.metadataJson. */
export type CartLineVariantMeta = {
  variantLabel?: string | null
  imageUrl?: string | null
  attributes?: ProductVariantAttributeDTO[]
}

export function buildCartLineVariantMeta(input: {
  variantLabel?: string | null
  imageUrl?: string | null
  attributes?: ReadonlyArray<ProductVariantAttributeDTO> | null
}): CartLineVariantMeta {
  const attributes = (input.attributes ?? [])
    .filter((a) => a.name?.trim() && a.value?.trim())
    .map((a) => ({ name: a.name.trim(), value: a.value.trim() }))
  return {
    ...(input.variantLabel?.trim() ? { variantLabel: input.variantLabel.trim() } : {}),
    ...(input.imageUrl?.trim() ? { imageUrl: input.imageUrl.trim() } : {}),
    ...(attributes.length ? { attributes } : {}),
  }
}

export function parseCartLineVariantMeta(raw: unknown): CartLineVariantMeta | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const attributesRaw = obj.attributes
  const attributes: ProductVariantAttributeDTO[] = []
  if (Array.isArray(attributesRaw)) {
    for (const item of attributesRaw) {
      if (!item || typeof item !== 'object') continue
      const name = typeof (item as { name?: unknown }).name === 'string'
        ? (item as { name: string }).name.trim()
        : ''
      const value = typeof (item as { value?: unknown }).value === 'string'
        ? (item as { value: string }).value.trim()
        : ''
      if (name && value) attributes.push({ name, value })
    }
  }
  const variantLabel =
    typeof obj.variantLabel === 'string' && obj.variantLabel.trim()
      ? obj.variantLabel.trim()
      : null
  const imageUrl =
    typeof obj.imageUrl === 'string' && obj.imageUrl.trim() ? obj.imageUrl.trim() : null
  if (!variantLabel && !imageUrl && attributes.length === 0) return null
  return {
    ...(variantLabel ? { variantLabel } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    ...(attributes.length ? { attributes } : {}),
  }
}

/** Chip leggibili per UI: mai ID numerici grezzi. */
export function variantMetaToChips(meta: CartLineVariantMeta | null | undefined): string[] {
  if (!meta) return []
  if (meta.attributes?.length) {
    return meta.attributes
      .map((a) => `${a.name}: ${a.value}`)
      .filter(Boolean)
      .slice(0, 6)
  }
  const label = meta.variantLabel?.trim()
  if (label && !/^\d+$/.test(label)) return [label]
  return []
}
