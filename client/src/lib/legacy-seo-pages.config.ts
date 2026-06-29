/** Pagine indicizzate sul sito WordPress legacy (ideadiluce.com). */
export type LegacySeoPageId =
  | 'home'
  | 'illuminazione-arredo'
  | 'acquista-ambiente'
  | 'privacy-policy'
  | 'negozio'
  | 'blog'
  | 'tos'
  | 'on-demand'

export type LegacySeoPageConfig = {
  canonicalPath: string
  title: string
  description: string
  h1?: string
  ogType?: 'website' | 'article'
}

export const LEGACY_SEO_PAGES: Record<LegacySeoPageId, LegacySeoPageConfig> = {
  home: {
    canonicalPath: '/',
    title: 'Home',
    description: 'La luce pensata',
    h1: 'Illumina con stile',
    ogType: 'website',
  },
  'illuminazione-arredo': {
    canonicalPath: '/illuminazione-arredo',
    title: "Illuminazione d'arredo",
    description:
      'Scegli il modello che accende il tuo stile: lampade da parete, sospensione, incasso, soffitto, tavolo e terra.',
    h1: "Illuminazione d'arredo",
    ogType: 'article',
  },
  'acquista-ambiente': {
    canonicalPath: '/acquista-ambiente',
    title: 'Acquista per ambiente',
    description:
      'Illuminazione per soggiorno, cucina, camera da letto, bagno, studio ed esterno. Ogni spazio, una luce.',
    h1: 'Ambienti',
    ogType: 'article',
  },
  'privacy-policy': {
    canonicalPath: '/privacy-policy',
    title: 'Privacy Policy',
    description: 'Informativa sul trattamento dei dati personali di TLB ITALY S.r.l.',
    h1: 'Privacy Policy',
    ogType: 'article',
  },
  negozio: {
    canonicalPath: '/negozio',
    title: 'Negozio',
    description:
      "Negozio illuminazione online: lampade d'arredo, prodotti tecnici, lampadine e accessori per casa e professionisti.",
    h1: 'Negozio',
    ogType: 'article',
  },
  blog: {
    canonicalPath: '/blog',
    title: 'Blog',
    description:
      'Guide e articoli su luce calda e fredda, trend illuminazione, design lampade e shop the look.',
    h1: 'Blog',
    ogType: 'article',
  },
  tos: {
    canonicalPath: '/tos',
    title: "Termini d'Uso e Condizioni di Vendita",
    description: 'Condizioni di utilizzo del sito e di vendita online di TLB ITALY S.r.l.',
    h1: "Termini d'Uso e Condizioni di Vendita",
    ogType: 'article',
  },
  'on-demand': {
    canonicalPath: '/on-demand',
    title: 'On Demand',
    description:
      'Se non trovi il prodotto nel catalogo online, contattaci: ti aiutiamo a trovare la soluzione di illuminazione perfetta.',
    h1: 'Contattaci ora! Siamo solo a un modulo di distanza.',
    ogType: 'article',
  },
}

export const SEO_CANONICAL_ALIAS_REDIRECTS: Array<{ fromPath: string; toPath: string; reason: string }> = [
  {
    fromPath: '/categoria-prodotto/illuminazione-arredo',
    toPath: '/illuminazione-arredo',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/ambienti',
    toPath: '/acquista-ambiente',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/privacy',
    toPath: '/privacy-policy',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/catalogo',
    toPath: '/negozio',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/catalog',
    toPath: '/negozio',
    reason: 'Alias EN → slug WordPress indicizzato',
  },
  {
    fromPath: '/guide',
    toPath: '/blog',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/termini',
    toPath: '/tos',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/prodotto-non-trovato',
    toPath: '/on-demand',
    reason: 'Alias PWA → slug WordPress indicizzato',
  },
  {
    fromPath: '/sample-page',
    toPath: '/chi-siamo',
    reason: 'WordPress placeholder → chi siamo',
  },
]

export function getLegacySeoPage(id: LegacySeoPageId): LegacySeoPageConfig {
  return LEGACY_SEO_PAGES[id]
}

export function legacySeoPath(id: LegacySeoPageId): string {
  return LEGACY_SEO_PAGES[id].canonicalPath
}
