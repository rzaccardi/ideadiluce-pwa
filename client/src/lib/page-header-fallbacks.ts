import type { ContentPageKey, SitePageKey } from '@/types/site-content'

const EDITORIAL_TITLES: Partial<Record<SitePageKey, string>> = {
  attacco: 'Scegli per attacco',
  ambienti: 'Ambienti',
  brand: 'Brand',
  guide: 'Guide alla luce',
  professionisti: 'Professionisti',
}

const CONTENT_PAGE_TITLES: Partial<Record<ContentPageKey, string>> = {
  'chi-siamo': 'Chi siamo',
  showroom: 'Vieni a trovarci dal vivo',
  'lavora-con-noi': 'Lavora con noi',
  spedizioni: 'Spedizioni e resi',
  pagamenti: 'Pagamenti',
  garanzia: 'Garanzia',
  contatti: 'Contatti',
  privacy: 'Privacy Policy',
  cookie: 'Cookie Policy',
  'prodotto-non-trovato': 'Non trovi il prodotto giusto?',
  'guide-luce-calda-naturale-fredda': 'Luce calda, naturale o fredda?',
  'guide-gu10-gu53': 'GU10 o GU5.3: qual è la differenza?',
  'guide-lampadina-r7s': 'Come scegliere una lampadina R7s',
  'guide-illuminare-soggiorno': 'Come illuminare il soggiorno',
  'guide-glossario': 'Glossario tecnico',
  'guide-scegliere-lampadina-led': 'Come scegliere la lampadina LED giusta',
  'guide-alimentatore-striscia-led': "Come calcolare l'alimentatore per una striscia LED",
}

export function getPageHeaderFallbackTitle(pageKey: SitePageKey): string | null {
  return EDITORIAL_TITLES[pageKey] ?? CONTENT_PAGE_TITLES[pageKey as ContentPageKey] ?? null
}
