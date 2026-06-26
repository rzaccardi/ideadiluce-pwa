import type {
  CatalogPageContent,
  EditorialPageContent,
  HomePageContent,
  SitePageKey,
  SiteShellContent,
} from './site.types.js'
import {
  CONTENT_PAGE_DEFAULTS,
  CONTENT_PAGE_KEYS,
} from './site-content-pages.defaults.js'
import { DEFAULT_PROFESSIONISTI_IT } from './site-professionisti.defaults.js'

const SOCKET_ITEMS = [
  { code: 'E27', hint: 'a vite grande', href: '/attacco/e27' },
  { code: 'E14', hint: 'a vite piccola', href: '/attacco/e14' },
  { code: 'GU10', hint: '230V bispina', href: '/attacco/gu10' },
  { code: 'GU5.3', hint: '12V MR16', href: '/attacco/gu5-3' },
  { code: 'R7s', hint: 'lineare', href: '/attacco/r7s' },
  { code: 'G9', hint: 'bispina 230V', href: '/attacco/g9' },
  { code: 'G4', hint: '12V capsula', href: '/attacco/g4' },
  { code: 'T8', hint: 'tubo G13', href: '/attacco/t8' },
]

function attaccoMegaMenuColumns() {
  const toLink = (s: (typeof SOCKET_ITEMS)[number]) => ({
    label: `${s.code} — ${s.hint}`,
    href: s.href,
  })
  return [
    { title: 'ATTACCHI COMUNI', links: SOCKET_ITEMS.slice(0, 4).map(toLink) },
    { title: 'ALTRI ATTACCHI', links: SOCKET_ITEMS.slice(4).map(toLink) },
    {
      title: 'SCOPRI',
      links: [
        { label: 'Tutti gli attacchi', href: '/attacco' },
        { label: 'Illuminazione tecnica', href: '/categoria-prodotto/illuminazione-tecnica' },
        { label: 'Prodotti tecnici', href: '/categoria-prodotto/illuminazione-tecnica/prodotti-tecnici' },
      ],
    },
  ]
}

export const DEFAULT_SHELL_IT: SiteShellContent = {
  utilityBar: {
    messages: ['Spedizione tracciata in tutta Italia', 'Showroom a Roma', 'Assistenza tecnica reale'],
    links: [
      { label: 'Professionisti', href: '/professionisti' },
      { label: 'Aiuto', href: '/guide' },
    ],
  },
  nav: {
    items: [
      {
        kind: 'dropdown',
        id: 'arredo',
        label: 'Arredo',
        href: '/categoria-prodotto/illuminazione-arredo',
        panel: {
          columns: [
            {
              title: 'PER TIPOLOGIA',
              links: [
                { label: 'Sospensione', href: '/catalog?world=design' },
                { label: 'Parete', href: '/catalog?world=design' },
                { label: 'Tavolo', href: '/catalog?world=design' },
                { label: 'Terra', href: '/catalog?world=design' },
                { label: 'Plafoniere', href: '/catalog?world=design' },
                { label: 'Faretti e incassi', href: '/catalog?world=design' },
              ],
            },
            {
              title: 'PER AMBIENTE',
              links: [
                { label: 'Soggiorno', href: '/ambienti/soggiorno' },
                { label: 'Cucina', href: '/ambienti/cucina' },
                { label: 'Camera', href: '/ambienti/camera' },
                { label: 'Bagno', href: '/ambienti/bagno' },
                { label: 'Studio', href: '/ambienti/studio' },
                { label: 'Esterno', href: '/ambienti/esterno' },
              ],
            },
            {
              title: 'PER STILE',
              links: [
                { label: 'Moderno', href: '/catalog?world=design' },
                { label: 'Classico', href: '/catalog?world=design' },
                { label: 'Minimal', href: '/catalog?world=design' },
                { label: 'Decorativo', href: '/catalog?world=design' },
                { label: 'Industrial', href: '/catalog?world=design' },
                { label: 'Outdoor', href: '/catalog?world=design' },
              ],
            },
            {
              title: 'BRAND',
              links: [
                { label: 'Artemide', href: '/brand/artemide' },
                { label: 'Flos', href: '/brand/flos' },
                { label: 'FontanaArte', href: '/brand/fontanaarte' },
                { label: 'Davide Groppi', href: '/brand/davide-groppi' },
                { label: 'Ideal Lux', href: '/brand/ideal-lux' },
                { label: 'TLB Italy', href: '/brand/tlb-italy' },
              ],
            },
          ],
          promo: {
            title: 'Consulenza progetto luce',
            description: "Inviaci una foto dell'ambiente: ti aiutiamo a comporre la luce giusta.",
            ctaLabel: 'Richiedi consulenza →',
            ctaHref: '/prodotto-non-trovato',
            variant: 'design',
          },
        },
      },
      {
        kind: 'dropdown',
        id: 'tecnico',
        label: 'Tecnico',
        href: '/categoria-prodotto/illuminazione-tecnica',
        panel: {
          columns: [
            {
              title: 'TECNOLOGIA',
              links: [
                { label: 'LED', href: '/categoria-prodotto/illuminazione-tecnica' },
                { label: 'Alogena', href: '/catalog?world=technical&q=alogena' },
                { label: 'Fluorescenza', href: '/catalog?world=technical&q=fluorescenza' },
                { label: 'Incandescenza', href: '/catalog?world=technical&q=incandescenza' },
                { label: 'Scarica', href: '/catalog?world=technical&q=scarica' },
              ],
            },
            {
              title: 'PER ATTACCO',
              links: [
                { label: 'E27 · E14', href: '/attacco/e27' },
                { label: 'GU10 · GU5.3', href: '/attacco/gu10' },
                { label: 'R7s · G9 · G4', href: '/attacco/r7s' },
                { label: 'G13 / T8', href: '/attacco/g13' },
                { label: 'AR111 · GX53', href: '/attacco/gx53' },
              ],
            },
            {
              title: 'PRODOTTI TECNICI',
              links: [
                { label: 'Alimentatori', href: '/categoria-prodotto/illuminazione-tecnica/prodotti-tecnici' },
                { label: 'Driver LED', href: '/categoria-prodotto/illuminazione-tecnica/prodotti-tecnici' },
                { label: 'Trasformatori', href: '/catalog?world=technical&q=trasformatore' },
                { label: 'Portalampade', href: '/catalog?world=technical&q=portalampade' },
                { label: 'Dimmer', href: '/catalog?world=technical&q=dimmer' },
              ],
            },
            {
              title: 'APPLICAZIONI',
              links: [
                { label: 'Strisce LED', href: '/catalog?world=technical' },
                { label: 'Profili LED', href: '/catalog?world=technical' },
                { label: 'Automotive', href: '/catalog?world=technical' },
                { label: 'Proiettori', href: '/catalog?world=technical' },
                { label: 'Outdoor IP65', href: '/catalog?world=technical' },
              ],
            },
          ],
          promo: {
            title: 'Prodotto non trovato?',
            description: 'Invia foto, EAN o codice: troviamo il ricambio o un\'alternativa.',
            ctaLabel: 'Richiedi supporto →',
            ctaHref: '/prodotto-non-trovato',
            variant: 'technical',
          },
        },
      },
      {
        kind: 'dropdown',
        id: 'attacco',
        label: 'Scegli per attacco',
        href: '/attacco',
        panel: {
          columns: attaccoMegaMenuColumns(),
          promo: {
            title: 'Non trovi l\'attacco?',
            description: 'Invia una foto o il codice prodotto: ti aiutiamo a trovare il ricambio.',
            ctaLabel: 'Richiedi supporto →',
            ctaHref: '/prodotto-non-trovato',
            variant: 'technical',
          },
        },
      },
      { kind: 'link', id: 'ambienti', label: 'Ambienti', href: '/ambienti' },
      { kind: 'link', id: 'brand', label: 'Brand', href: '/brand' },
      { kind: 'link', id: 'guide', label: 'Guide', href: '/guide' },
    ],
  },
  trustBar: [
    { title: 'Assistenza reale', subtitle: 'Ti aiutiamo a scegliere' },
    { title: 'Showroom Roma', subtitle: 'Vieni a trovarci dal vivo' },
    { title: 'Ricambi difficili', subtitle: 'Foto, EAN o codice prodotto' },
    { title: 'Spedizione tracciata', subtitle: 'In tutta Italia' },
  ],
  footer: {
    columns: [
      {
        title: 'Idea di Luce',
        links: [
          { label: 'Chi siamo', href: '/chi-siamo' },
          { label: 'Showroom Roma', href: '/showroom' },
          { label: 'Professionisti', href: '/professionisti' },
          { label: 'Lavora con noi', href: '/lavora-con-noi' },
        ],
      },
      {
        title: 'Servizio clienti',
        links: [
          { label: 'Spedizioni e resi', href: '/spedizioni' },
          { label: 'Pagamenti', href: '/pagamenti' },
          { label: 'Garanzia', href: '/garanzia' },
          { label: 'Contatti', href: '/contatti' },
        ],
      },
      {
        title: 'Utilità',
        links: [
          { label: 'Guide alla luce', href: '/guide' },
          { label: 'Scegli per attacco', href: '/attacco' },
          { label: 'Brand', href: '/brand' },
          { label: 'Ambienti', href: '/ambienti' },
          { label: 'Glossario tecnico', href: '/guide/glossario' },
          { label: 'Privacy', href: '/privacy' },
          { label: 'Cookie', href: '/cookie' },
        ],
      },
    ],
    notFoundCta: {
      title: 'Non trovi il prodotto?',
      description: 'Invia una foto dell\'attacco o il codice: ti aiutiamo noi.',
      ctaLabel: 'Richiedi supporto →',
      ctaHref: '/prodotto-non-trovato',
    },
    legalNote: '© Idea di Luce · P.IVA 00000000000',
  },
}

export const DEFAULT_HOME_IT: HomePageContent = {
  hero: {
    design: {
      eyebrow: 'IL DESIGN',
      title: "Illuminazione d'arredo",
      description:
        "Lampade, sospensioni e applique d'autore. Brand, designer e ambienti per dare carattere ai tuoi spazi.",
      ctaLabel: "Esplora l'arredo →",
      ctaHref: '/categoria-prodotto/illuminazione-arredo',
      footerLine: 'ARTEMIDE · FLOS · TLB ITALY · VOSSLOH',
    },
    technical: {
      eyebrow: 'LA TECNICA',
      title: 'Lampadine e prodotti tecnici',
      description:
        'Lampadine, alimentatori, driver e ricambi. Cerca per attacco, watt, Kelvin o codice EAN e trova subito il prodotto giusto.',
      ctaLabel: 'Vai al catalogo tecnico →',
      ctaHref: '/categoria-prodotto/illuminazione-tecnica',
      chips: ['E27', 'GU10', 'R7s', 'G9', 'G4', 'T8'],
    },
  },
  search: {
    title: 'Una sola ricerca, per il design e per la tecnica',
    subtitle: 'Cerca un prodotto di design o un ricambio: nome, attacco, codice, EAN, marca o ambiente.',
    placeholder: 'Cerca per prodotto, attacco, codice, EAN, marca o ambiente',
    ctaLabel: 'Cerca',
    hints: ['R7s 118mm', 'GU5.3 12V 20W', 'E27 2700K', 'TLB 322805', 'Artemide Eclisse'],
  },
  sockets: {
    eyebrow: 'LA TECNICA',
    title: 'Scegli per attacco',
    subtitle: 'Sai già cosa cerchi? Vai dritto al tuo attacco.',
    linkLabel: 'Tutti gli attacchi →',
    linkHref: '/attacco',
    items: SOCKET_ITEMS,
  },
  paths: {
    title: 'Scegli come cercare',
    subtitle: 'Ogni percorso ti porta dritto a quello che cerchi.',
    cards: [
      {
        title: 'Per ambiente',
        description: 'Soggiorno, cucina, bagno, camera, studio, esterno',
        ctaLabel: 'Esplora →',
        href: '/ambienti',
        variant: 'design',
      },
      {
        title: 'Per attacco',
        description: 'E27 · GU10 · R7s · G9 · G4 · T8',
        ctaLabel: 'Trova →',
        href: '/attacco',
        variant: 'technical',
      },
      {
        title: 'Per brand',
        description: 'Artemide, Flos, TLB, Vossloh, Mean Well',
        ctaLabel: 'Vedi i brand →',
        href: '/brand',
        variant: 'design',
      },
      {
        title: 'Prodotti tecnici',
        description: 'Alimentatori, driver, portalampade, accessori',
        ctaLabel: 'Vai al tecnico →',
        href: '/catalog?world=technical',
        variant: 'technical',
      },
      {
        title: 'Non sai cosa cercare?',
        description: 'Invia una foto o il codice, ti aiutiamo noi',
        ctaLabel: 'Richiedi supporto →',
        href: '/prodotto-non-trovato',
        variant: 'dark',
      },
    ],
  },
  rooms: {
    eyebrow: 'IL DESIGN',
    title: 'Esplora per ambiente',
    subtitle: "La luce giusta per ogni stanza, dal soggiorno all'esterno.",
    items: [
      { title: 'Soggiorno', imageUrl: '/site/images/room-soggiorno.png', href: '/ambienti/soggiorno' },
      { title: 'Cucina', imageUrl: '/site/images/room-cucina.png', href: '/ambienti/cucina' },
      { title: 'Camera', imageUrl: '/site/images/room-camera.png', href: '/ambienti/camera' },
      { title: 'Bagno', imageUrl: '/site/images/room-bagno.png', href: '/ambienti/bagno' },
      { title: 'Studio', imageUrl: '/site/images/room-studio.png', href: '/ambienti/studio' },
      { title: 'Esterno', imageUrl: '/site/images/room-esterno.png', href: '/ambienti/esterno' },
    ],
  },
  designShowcase: {
    eyebrow: 'IL DESIGN',
    title: "Luci d'autore",
    subtitle: 'Icone, brand e prodotti selezionati per arredare con la luce.',
    linkLabel: "Tutto l'arredo →",
    linkHref: '/catalog?world=design',
    productCount: 4,
    searchQuery: 'sospensione lampada',
  },
  technicalShowcase: {
    eyebrow: 'LA TECNICA',
    title: 'I più cercati · alimentatori e driver',
    subtitle: "Dati tecnici a colpo d'occhio, disponibilità e confronto.",
    linkLabel: 'Catalogo tecnico →',
    linkHref: '/catalog?world=technical',
    productCount: 4,
    searchQuery: 'alimentatore driver',
  },
  brands: {
    title: 'I nostri brand',
    subtitle: 'Arredo, tecnica e professionale: solo marchi selezionati.',
    items: [
      'Artemide',
      'Flos',
      'FontanaArte',
      'Davide Groppi',
      'TLB Italy',
      'Ideal Lux',
      'Eglo',
      'Philips',
      'Osram',
      'Ledvance',
      'Vossloh',
      'Mean Well',
    ],
  },
  guides: {
    eyebrow: 'GUIDE',
    title: 'Guide alla luce',
    subtitle: 'Ti aiutiamo a scegliere con consapevolezza, dal design alla tecnica.',
    linkLabel: 'Tutte le guide →',
    linkHref: '/guide',
    items: [
      {
        category: 'BASE',
        title: 'Luce calda, naturale o fredda?',
        meta: '5 min · Leggi →',
        href: '/guide/luce-calda-naturale-fredda',
      },
      {
        category: 'ATTACCHI',
        title: 'GU10 o GU5.3: qual è la differenza?',
        meta: '4 min · Leggi →',
        href: '/guide/gu10-gu53',
      },
      {
        category: 'ACQUISTO',
        title: 'Come scegliere una lampadina R7s',
        meta: '6 min · Leggi →',
        href: '/guide/lampadina-r7s',
      },
      {
        category: 'AMBIENTE',
        title: 'Come illuminare il soggiorno',
        meta: '7 min · Leggi →',
        href: '/guide/illuminare-soggiorno',
      },
    ],
  },
  b2b: {
    eyebrow: 'PROFESSIONISTI',
    title: 'Area riservata per installatori e rivenditori',
    description: 'Listini dedicati, riordino rapido con EAN/SKU e assistenza tecnica prioritaria.',
    ctaLabel: 'Accedi all\'area professionisti →',
    ctaHref: '/professionisti',
    bullets: ['Listino B2B dedicato', 'Riordino rapido EAN/SKU', 'Assistenza tecnica prioritaria'],
  },
  leadGen: {
    title: 'Non trovi il prodotto che cerchi?',
    description: 'Invia una foto dell\'attacco o il codice prodotto: il nostro team ti risponde entro 24 ore.',
    ctaLabel: 'Richiedi supporto →',
    ctaHref: '/prodotto-non-trovato',
  },
  newsletter: {
    title: 'Resta aggiornato su novità e guide',
    description: 'Iscriviti alla newsletter: una email al mese, niente spam.',
    placeholder: 'La tua email',
    ctaLabel: 'Iscriviti',
    privacyNote: 'Puoi disiscriverti in qualsiasi momento.',
  },
}

export const DEFAULT_ATACCO_IT: EditorialPageContent = {
  eyebrow: 'SCEGLI PER ATTACCO',
  title: 'Scegli per attacco',
  subtitle: 'Trova la lampadina giusta per il tuo attacco.',
  intro: "Riconosci l'attacco dalla forma e arriva al prodotto compatibile in pochi click.",
  items: SOCKET_ITEMS.map((s) => ({
    code: s.code,
    title: s.code,
    description: s.hint,
    href: s.href,
  })),
  cta: {
    label: 'Non trovi l\'attacco? Richiedi supporto →',
    href: '/prodotto-non-trovato',
  },
}

export const DEFAULT_AMBIENTI_IT: EditorialPageContent = {
  eyebrow: 'SHOP BY ROOM · SHOP THE LOOK',
  title: 'Scegli per ambiente',
  subtitle: "La luce giusta per ogni stanza, dal soggiorno all'esterno.",
  intro: 'Scegli uno spazio, lasciati ispirare da ambienti reali e scopri i prodotti per ricreare lo stesso effetto luminoso.',
  items: [
    { title: 'Soggiorno', imageUrl: '/site/images/room-soggiorno.png', href: '/ambienti/soggiorno' },
    { title: 'Cucina', imageUrl: '/site/images/room-cucina.png', href: '/ambienti/cucina' },
    { title: 'Camera', imageUrl: '/site/images/room-camera.png', href: '/ambienti/camera' },
    { title: 'Bagno', imageUrl: '/site/images/room-bagno.png', href: '/ambienti/bagno' },
    { title: 'Studio', imageUrl: '/site/images/room-studio.png', href: '/ambienti/studio' },
    { title: 'Esterno', imageUrl: '/site/images/room-esterno.png', href: '/ambienti/esterno' },
  ],
}

export const DEFAULT_BRAND_IT: EditorialPageContent = {
  eyebrow: 'DIRECTORY MARCHI',
  title: 'Brand di illuminazione',
  subtitle: 'Scopri i marchi selezionati da IdeaDiLuce: design, lampadine, LED e prodotti tecnici.',
  intro: 'Scegli il brand che conosci, o trovalo in base a cosa cerchi.',
  items: [
    'Artemide', 'Flos', 'FontanaArte', 'Davide Groppi', 'TLB Italy', 'Ideal Lux',
    'Eglo', 'Philips', 'Osram', 'Ledvance', 'Vossloh', 'Mean Well',
  ].map((name) => ({
    title: name,
    href: `/brand/${({
      Artemide: 'artemide',
      Flos: 'flos',
      FontanaArte: 'fontanaarte',
      'Davide Groppi': 'davide-groppi',
      'TLB Italy': 'tlb-italy',
      'Ideal Lux': 'ideal-lux',
      Eglo: 'eglo',
      Philips: 'philips',
      Osram: 'osram',
      Ledvance: 'ledvance',
      Vossloh: 'vossloh',
      'Mean Well': 'mean-well',
    } as Record<string, string>)[name] ?? name.toLowerCase().replace(/\s+/g, '-')}`,
  })),
}

export const DEFAULT_GUIDE_IT: EditorialPageContent = {
  eyebrow: 'GUIDE',
  title: 'Guide alla luce',
  subtitle: 'Ti aiutiamo a scegliere con consapevolezza, dal design alla tecnica.',
  intro: 'Articoli pratici su attacchi, temperatura colore, dimmerabilità e scelta delle lampadine.',
  items: [
    { category: 'BASE', title: 'Luce calda, naturale o fredda?', meta: '5 min', href: '/guide/luce-calda-naturale-fredda' },
    { category: 'BASE', title: 'Come scegliere la lampadina LED', meta: '5 min', href: '/guide/scegliere-lampadina-led' },
    { category: 'ATTACCHI', title: 'GU10 o GU5.3: qual è la differenza?', meta: '4 min', href: '/guide/gu10-gu53' },
    { category: 'TECNICO', title: 'Alimentatore per striscia LED', meta: '6 min', href: '/guide/alimentatore-striscia-led' },
    { category: 'ACQUISTO', title: 'Come scegliere una lampadina R7s', meta: '6 min', href: '/guide/lampadina-r7s' },
    { category: 'AMBIENTE', title: 'Come illuminare il soggiorno', meta: '7 min', href: '/guide/illuminare-soggiorno' },
    { category: 'GLOSSARIO', title: 'Glossario tecnico', meta: 'Riferimento', href: '/guide/glossario' },
  ],
  cta: { label: 'Hai dubbi? Contattaci →', href: '/contatti' },
}

export const DEFAULT_CATALOG_IT: CatalogPageContent = {
  worlds: {
    design: {
      title: 'Illuminazione d\'arredo',
      description: 'Lampade, sospensioni e applique per arredare con la luce.',
      defaultQuery: '',
    },
    technical: {
      title: 'Lampadine e prodotti tecnici',
      description: 'Lampadine, alimentatori, driver e ricambi. Cerca per attacco, watt o codice.',
      defaultQuery: '',
    },
  },
}

export const SITE_PAGE_DEFAULTS: Record<SitePageKey, unknown> = {
  shell: DEFAULT_SHELL_IT,
  home: DEFAULT_HOME_IT,
  attacco: DEFAULT_ATACCO_IT,
  ambienti: DEFAULT_AMBIENTI_IT,
  brand: DEFAULT_BRAND_IT,
  guide: DEFAULT_GUIDE_IT,
  catalog: DEFAULT_CATALOG_IT,
  professionisti: DEFAULT_PROFESSIONISTI_IT,
  ...CONTENT_PAGE_DEFAULTS,
}

export const SITE_PAGE_KEYS: SitePageKey[] = [
  'shell',
  'home',
  'attacco',
  'ambienti',
  'brand',
  'guide',
  'catalog',
  'professionisti',
  ...CONTENT_PAGE_KEYS,
]

export function defaultSiteContent(pageKey: SitePageKey) {
  return SITE_PAGE_DEFAULTS[pageKey]
}
