import { getSiteUrl } from '@/lib/env'

/** Immagine social di default (1200×630, /public/og.jpg). */
export const DEFAULT_OG_IMAGE_PATH = '/og.jpg'

export const DEFAULT_OG_IMAGE_WIDTH = 1200
export const DEFAULT_OG_IMAGE_HEIGHT = 630

export const DEFAULT_OG_IMAGE_ALT =
  "Idea di Luce — Illuminazione d'arredo e prodotti tecnici"

export function getDefaultOgImageUrl(siteUrl?: string): string {
  const origin = (siteUrl ?? getSiteUrl()).replace(/\/$/, '')
  return `${origin}${DEFAULT_OG_IMAGE_PATH}`
}

/** URL assoluto per Open Graph; fallback all'immagine di default del sito. */
export function resolveOgImageUrl(ogImage?: string | null, siteUrl?: string): string {
  if (ogImage) {
    if (ogImage.startsWith('http')) return ogImage
    const origin = (siteUrl ?? getSiteUrl()).replace(/\/$/, '')
    return `${origin}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`
  }
  return getDefaultOgImageUrl(siteUrl)
}
