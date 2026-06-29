import type { ContentPageKey, HomePageContent, SitePageKey } from '@/types/site-content'

export const GUIDE_SLUG_TO_PAGE_KEY: Record<string, ContentPageKey> = {
  'luce-calda-o-fredda': 'guide-luce-calda-o-fredda',
  'calipso-artemide-io-vengo-dalla-luna': 'guide-calipso-artemide-io-vengo-dalla-luna',
  'la-natura-trend-2024': 'guide-la-natura-trend-2024',
  'luce-calda-naturale-fredda': 'guide-luce-calda-naturale-fredda',
  'gu10-gu53': 'guide-gu10-gu53',
  'lampadina-r7s': 'guide-lampadina-r7s',
  'illuminare-soggiorno': 'guide-illuminare-soggiorno',
  glossario: 'guide-glossario',
  'scegliere-lampadina-led': 'guide-scegliere-lampadina-led',
  'alimentatore-striscia-led': 'guide-alimentatore-striscia-led',
}

export function guidePageKeyFromSlug(slug: string): ContentPageKey | null {
  return GUIDE_SLUG_TO_PAGE_KEY[slug] ?? null
}

export function isGuidePageKey(pageKey: string): pageKey is ContentPageKey {
  return pageKey.startsWith('guide-')
}

export function isContentPage(content: unknown): content is { blocks: unknown[]; title: string } {
  return typeof content === 'object' && content !== null && 'blocks' in content && 'title' in content
}

export function isEditorialPage(content: unknown): content is { items: unknown[]; title: string } {
  return (
    typeof content === 'object' &&
    content !== null &&
    'items' in content &&
    'title' in content &&
    !('blocks' in content)
  )
}

export function isProfessionistiPageContent(
  content: unknown,
): content is import('@/types/site-content').ProfessionistiPageContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'registration' in content &&
    'quickReorder' in content &&
    'features' in content
  )
}

export function isHomePageContent(content: unknown): content is HomePageContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'hero' in content &&
    'search' in content &&
    'paths' in content
  )
}

/** Route pathname → CMS pageKey */
export const STATIC_ROUTE_PAGE_KEYS: Record<string, SitePageKey> = {
  '/chi-siamo': 'chi-siamo',
  '/showroom': 'showroom',
  '/professionisti': 'professionisti',
  '/lavora-con-noi': 'lavora-con-noi',
  '/spedizioni': 'spedizioni',
  '/pagamenti': 'pagamenti',
  '/garanzia': 'garanzia',
  '/contatti': 'contatti',
  '/privacy-policy': 'privacy',
  '/cookie': 'cookie',
  '/tos': 'termini',
  '/on-demand': 'prodotto-non-trovato',
  '/acquista-ambiente': 'ambienti',
  '/blog': 'guide',
  '/negozio': 'catalog',
  '/illuminazione-arredo': 'catalog',
}
