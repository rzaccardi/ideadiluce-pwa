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
  'applicazione',
  'dettaglio',
  'certificazione',
])

const LIFESTYLE_TAG = 'ambiente'
const ACCESA_TAG = 'accesa'

const NON_PACKSHOT_TAGS = new Set([LIFESTYLE_TAG, ACCESA_TAG, ...HOVER_EXCLUDE_TAGS])

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
 * Preferisce il tag `foto` (escludendo ambientata, accesa e schede tecniche).
 */
export function pickProductCardPackshotUrl(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  mainImageUrl: string | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
  lifestyleHintUrl?: string | null,
): string | null {
  const images = galleryImages(gallery)
  const lifestyleHint = lifestyleHintUrl?.trim() || null

  const isNonPackshotUrl = (url: string) => {
    if (lifestyleHint && urlsMatch(url, lifestyleHint)) return true
    return images.some((item) => {
      const tag = item.tag || 'foto'
      return (tag === LIFESTYLE_TAG || tag === ACCESA_TAG) && urlsMatch(item.url, url)
    })
  }

  const fromGallery = images.find((item) => {
    const tag = item.tag || 'foto'
    if (NON_PACKSHOT_TAGS.has(tag)) return false
    return !isNonPackshotUrl(item.url)
  })
  if (fromGallery) return fromGallery.url

  const main = mainImageUrl?.trim() || null
  if (main && !isNonPackshotUrl(main)) return main
  return main
}

/**
 * Sceglie l’immagine hover per le card arredo.
 * 1. prima immagine taggata `accesa`
 * 2. altrimenti prima immagine taggata `ambiente`
 * 3. fallback: ultima extra `foto` diversa dal packshot
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

  const accesa = images.find(
    (item) => (item.tag || 'foto') === ACCESA_TAG && isDifferentFromPackshot(item.url),
  )
  if (accesa) return accesa.url

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

/** Solo foto taggata `accesa` (per il toggle globale luci). */
export function pickProductCardAccesaImageUrl(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  packshotUrl: string | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
): string | null {
  const images = galleryImages(gallery)
  const isDifferentFromPackshot = (url: string) => !packshotUrl?.trim() || !urlsMatch(url, packshotUrl)
  const accesa = images.find(
    (item) => (item.tag || 'foto') === ACCESA_TAG && isDifferentFromPackshot(item.url),
  )
  return accesa?.url ?? null
}

/**
 * Hover sulla foto default (tab Foto / hero packshot): accesa se c’è, altrimenti ambiente.
 * `isDefaultView` è false sulle foto secondarie del tab Foto.
 */
export function pickDefaultFotoHoverPreview(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  current: { type?: string; tag?: string; url?: string | null } | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
  isDefaultView = true,
): { url: string; tag: string } | null {
  if (!isDefaultView) return null
  if (!current || (current.type ?? 'image') !== 'image' || !current.url?.trim()) return null
  if ((current.tag || 'foto') !== 'foto') return null

  const hoverUrl = pickProductCardHoverImageUrl(gallery, current.url, urlsMatch)
  if (!hoverUrl || urlsMatch(hoverUrl, current.url)) return null
  const hoverItem = galleryImages(gallery).find((item) => urlsMatch(item.url, hoverUrl))
  return { url: hoverUrl, tag: hoverItem?.tag || 'foto' }
}

export function resolveProductCardImagePair(
  gallery: readonly ProductCardHoverGalleryItem[] | null | undefined,
  mainImageUrl: string | null | undefined,
  urlsMatch: (a: string | null | undefined, b: string | null | undefined) => boolean,
  dedicatedLifestyleUrl?: string | null,
): { imageUrl: string | null; hoverImageUrl: string | null; accesaImageUrl: string | null } {
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
    accesaImageUrl: pickProductCardAccesaImageUrl(galleryWithDedicated, imageUrl, urlsMatch),
  }
}
