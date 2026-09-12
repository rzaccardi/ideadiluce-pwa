export type ProductCardHoverGalleryItem = {
  type?: string
  tag?: string
  url?: string | null
}

/** Tag gallery che non sono foto ambientate (schede, misure, dettagli tecnici). */
const HOVER_EXCLUDE_TAGS = new Set([
  'attacco',
  'misure',
  'misura',
  'accesa',
  'applicazione',
  'dettaglio',
  'certificazione',
])

const LIFESTYLE_TAG = 'ambiente'

const NON_PACKSHOT_TAGS = new Set([LIFESTYLE_TAG, ...HOVER_EXCLUDE_TAGS])

function galleryImages(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
): Array<ProductCardHoverGalleryItem & { url: string }> {
  if (!gallery?.length) return []
  return gallery.filter(
    (item): item is ProductCardHoverGalleryItem & { url: string } =>
      Boolean(item.url?.trim()) && (item.type ?? 'image') === 'image',
  )
}

/**
 * Packshot su sfondo bianco/neutro per le card arredo.
 * Preferisce il tag `foto` (escludendo l’ambientata e le schede tecniche).
 */
export function pickProductCardPackshotUrl(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  mainImageUrl: string | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
  lifestyleHintUrl?: string | null,
): string | null {
  const images = galleryImages(gallery)
  const lifestyleHint = lifestyleHintUrl?.trim() || null

  const isLifestyleUrl = (url: string) => {
    if (lifestyleHint && urlsMatch(url, lifestyleHint)) return true
    return images.some((item) => (item.tag || 'foto') === LIFESTYLE_TAG && urlsMatch(item.url, url))
  }

  const fromGallery = images.find((item) => {
    const tag = item.tag || 'foto'
    if (NON_PACKSHOT_TAGS.has(tag)) return false
    return !isLifestyleUrl(item.url)
  })
  if (fromGallery) return fromGallery.url

  const main = mainImageUrl?.trim() || null
  if (main && !isLifestyleUrl(main)) return main
  return main
}

/**
 * Sceglie l’immagine hover per le card arredo.
 * 1. prima immagine taggata `ambiente`
 * 2. fallback: ultima extra `foto` diversa dal packshot
 *    (in Odoo la seconda è spesso un duplicato del packshot; l’ambientata è in coda)
 * Se manca una seconda foto utile → `null` (resta solo packshot).
 */
export function pickProductCardHoverImageUrl(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  packshotUrl: string | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
): string | null {
  const images = galleryImages(gallery)
  if (!images.length) return null

  const isDifferentFromPackshot = (url: string) => !packshotUrl?.trim() || !urlsMatch(url, packshotUrl)

  const ambiente = images.find(
    (item) => (item.tag || 'foto') === LIFESTYLE_TAG && isDifferentFromPackshot(item.url),
  )
  if (ambiente) return ambiente.url

  const extras = images.filter((item) => {
    const tag = item.tag || 'foto'
    if (HOVER_EXCLUDE_TAGS.has(tag)) return false
    return isDifferentFromPackshot(item.url)
  })
  return extras.at(-1)?.url ?? null
}

export function resolveProductCardImagePair(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  mainImageUrl: string | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
  dedicatedLifestyleUrl?: string | null,
): { imageUrl: string | null; hoverImageUrl: string | null } {
  const dedicated = dedicatedLifestyleUrl?.trim() || null
  const galleryWithDedicated = dedicated
    ? [{ type: 'image' as const, tag: LIFESTYLE_TAG, url: dedicated }, ...(gallery ?? [])]
    : gallery

  const imageUrl = pickProductCardPackshotUrl(
    galleryWithDedicated,
    mainImageUrl,
    urlsMatch,
    dedicated,
  )
  return {
    imageUrl,
    hoverImageUrl: pickProductCardHoverImageUrl(galleryWithDedicated, imageUrl, urlsMatch),
  }
}
