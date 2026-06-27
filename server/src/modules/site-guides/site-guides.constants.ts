import type { ContentPageKey } from '../site/site-content-pages.defaults.js'

export const GUIDE_CATEGORIES = ['BASE', 'ATTACCHI', 'TECNICO', 'ACQUISTO', 'AMBIENTE', 'GLOSSARIO'] as const
export type GuideCategory = (typeof GUIDE_CATEGORIES)[number]

export type GuideSeed = {
  slug: string
  category: GuideCategory
  readingMeta: string
  sortOrder: number
  indexed: boolean
  featured: boolean
}

export const DEFAULT_SITE_GUIDES: GuideSeed[] = [
  { slug: 'luce-calda-naturale-fredda', category: 'BASE', readingMeta: '5 min', sortOrder: 10, indexed: true, featured: true },
  { slug: 'scegliere-lampadina-led', category: 'BASE', readingMeta: '5 min', sortOrder: 20, indexed: true, featured: true },
  { slug: 'gu10-gu53', category: 'ATTACCHI', readingMeta: '4 min', sortOrder: 30, indexed: true, featured: false },
  { slug: 'alimentatore-striscia-led', category: 'TECNICO', readingMeta: '6 min', sortOrder: 40, indexed: true, featured: false },
  { slug: 'lampadina-r7s', category: 'ACQUISTO', readingMeta: '6 min', sortOrder: 50, indexed: true, featured: false },
  { slug: 'illuminare-soggiorno', category: 'AMBIENTE', readingMeta: '7 min', sortOrder: 60, indexed: true, featured: false },
  { slug: 'glossario', category: 'GLOSSARIO', readingMeta: 'Riferimento', sortOrder: 70, indexed: true, featured: false },
]

export function guidePageKey(slug: string): ContentPageKey {
  return `guide-${slug}` as ContentPageKey
}

export function isGuidePageKey(pageKey: string) {
  return pageKey.startsWith('guide-') && pageKey !== 'guide'
}

export function guideSlugFromPageKey(pageKey: string) {
  return pageKey.startsWith('guide-') ? pageKey.slice('guide-'.length) : null
}
