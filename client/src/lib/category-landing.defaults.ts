import type { CategoryLandingContent, CategoryLandingKey } from '@/types/category-landing'

export const DEFAULT_DESIGN_CATEGORY_IT: CategoryLandingContent = {
  breadcrumb: [{ label: 'Home', href: '/' }, { label: "Illuminazione d'arredo" }],
  eyebrow: 'IL DESIGN',
  title: "Illuminazione d'arredo",
  description:
    "Lampade, sospensioni, applique e soluzioni decorative selezionate per dare carattere agli ambienti. Brand, designer e icone del design, con la consulenza di chi conosce davvero la luce.",
  stats: [
    { label: 'prodotti', value: '242' },
    { label: 'brand', value: '28' },
    { label: 'ambienti', value: '6' },
  ],
  typeTiles: [
    { key: 'sospensione', label: 'Sospensione', count: '64', href: '/categoria/sospensione' },
    { key: 'parete', label: 'Parete', count: '48', href: '/categoria/parete' },
    { key: 'tavolo', label: 'Tavolo', count: '39', href: '/categoria/tavolo' },
    { key: 'terra', label: 'Terra', count: '27', href: '/categoria/terra' },
    { key: 'plafoniere', label: 'Plafoniere', count: '31', href: '/categoria/soffitto' },
    { key: 'faretti', label: 'Faretti e incassi', count: '33', href: '/categoria/incasso' },
  ],
  filtersTitle: 'Filtri',
  filtersResetLabel: 'Azzera',
  filterGroups: [
    {
      kind: 'checkbox',
      label: 'Ambiente',
      options: [
        { label: 'Soggiorno', value: 'ambiente-soggiorno', queryToken: 'soggiorno' },
        { label: 'Cucina', value: 'ambiente-cucina', queryToken: 'cucina' },
        { label: 'Camera', value: 'ambiente-camera', queryToken: 'camera' },
        { label: 'Studio', value: 'ambiente-studio', queryToken: 'studio' },
        { label: 'Esterno', value: 'ambiente-esterno', queryToken: 'esterno' },
      ],
    },
    {
      kind: 'checkbox',
      label: 'Tipologia',
      options: [
        { label: 'Sospensione', value: 'tipologia-sospensione', queryToken: 'sospensione' },
        { label: 'Parete', value: 'tipologia-parete', queryToken: 'parete applique' },
        { label: 'Tavolo', value: 'tipologia-tavolo', queryToken: 'tavolo' },
        { label: 'Terra', value: 'tipologia-terra', queryToken: 'piantana terra' },
        { label: 'Incasso', value: 'tipologia-incasso', queryToken: 'incasso faretto' },
      ],
    },
    {
      kind: 'checkbox',
      label: 'Brand',
      options: [
        { label: 'Artemide', value: 'brand-artemide' },
        { label: 'Flos', value: 'brand-flos' },
        { label: 'FontanaArte', value: 'brand-fontanaarte' },
        { label: 'TLB Italy', value: 'brand-tlb-italy' },
        { label: 'Ideal Lux', value: 'brand-ideal-lux' },
      ],
    },
    {
      kind: 'chips',
      label: 'Finitura',
      options: [
        { label: 'Nero', value: 'finitura-nero', queryToken: 'nero' },
        { label: 'Bianco', value: 'finitura-bianco', queryToken: 'bianco' },
        { label: 'Oro', value: 'finitura-oro', queryToken: 'oro' },
        { label: 'Ottone', value: 'finitura-ottone', queryToken: 'ottone' },
        { label: 'Cromo', value: 'finitura-cromo', queryToken: 'cromo' },
        { label: 'Vetro', value: 'finitura-vetro', queryToken: 'vetro' },
      ],
    },
    {
      kind: 'checkbox',
      label: 'Prezzo',
      options: [
        { label: '€ 0 – 100', value: 'price-0-100' },
        { label: '€ 100 – 300', value: 'price-100-300' },
        { label: '€ 300 – 700', value: 'price-300-700' },
        { label: '€ 700 +', value: 'price-700-plus' },
      ],
    },
    {
      kind: 'checkbox',
      label: 'Disponibilità',
      options: [
        { label: 'Pronta consegna', value: 'stock-in' },
        { label: 'Su ordinazione', value: 'stock-order' },
      ],
    },
  ],
  sortLabel: 'Ordina:',
  sortValue: 'Rilevanza',
  loadMoreLabel: 'Carica altri prodotti',
  guide: {
    eyebrow: "GUIDA ALL'ACQUISTO",
    title: "Come scegliere l'illuminazione d'arredo",
    description:
      "Parti dall'ambiente e dalla funzione: una sospensione sopra il tavolo, un'applique per la parete, una piantana per l'angolo lettura. Valuta poi stile e finitura per dialogare con l'arredo, e la sorgente luminosa (attacco, Kelvin, dimmerabilità). Per gli esterni controlla sempre il grado IP. Nel dubbio, inviaci una foto dell'ambiente: ti aiutiamo a comporre la luce giusta.",
    faq: [
      { question: 'Qual è la differenza tra luce diretta e diffusa?' },
      { question: 'Le lampade sono dimmerabili?' },
      { question: 'La sorgente luminosa è inclusa?' },
      { question: 'Quali tempi di consegna per i prodotti su ordinazione?' },
    ],
  },
  articles: {
    eyebrow: 'MAGAZINE',
    title: 'Ispirazioni d\'arredo',
    subtitle: 'Trend, designer e consigli per scegliere la luce giusta negli ambienti.',
    items: [
      {
        category: 'SHOP THE LOOK',
        title: 'Luce CALDA o FREDDA: la scelta illuminante',
        meta: 'Giugno 2024',
        href: '/guide/luce-calda-o-fredda',
      },
      {
        category: 'DESIGN SPOTLIGHT',
        title: 'CALIPSO – Designed by Artemide',
        meta: 'Giugno 2024',
        href: '/guide/calipso-artemide-io-vengo-dalla-luna',
      },
      {
        category: 'STYLE RADAR',
        title: 'Lighting trends 2024 – LA NATURA',
        meta: 'Giugno 2024',
        href: '/guide/la-natura-trend-2024',
      },
    ],
  },
  cta: {
    title: 'Vuoi un consiglio sulla luce giusta?',
    description:
      "Inviaci una foto dell'ambiente o del prodotto che cerchi: il nostro showroom di Roma ti aiuta a scegliere brand, finitura e composizione luminosa.",
    primaryCta: { label: 'Richiedi consulenza', href: '/contatti' },
    secondaryCta: { label: 'Invia una foto', href: '/prodotto-non-trovato' },
  },
  pageSize: 9,
}

const TECHNICAL_BASE: Omit<CategoryLandingContent, 'breadcrumb' | 'title' | 'subtypeChips'> = {
  eyebrow: 'LA TECNICA',
  description:
    'Alimentatori, driver LED, trasformatori, portalampade e accessori. Filtra per tecnologia, potenza, corrente e attacco — o cerca direttamente il codice.',
  supportCard: {
    title: 'Non sai quale scegliere?',
    description: 'Inviaci una foto o il codice del vecchio prodotto: troviamo il ricambio compatibile.',
    primaryCta: { label: 'Invia foto', href: '/prodotto-non-trovato' },
    secondaryCta: { label: 'Scegli per attacco', href: '/attacco' },
  },
  filtersTitle: 'Filtri tecnici',
  filtersResetLabel: 'Azzera',
  filterGroups: [
    {
      kind: 'chips',
      label: 'Attacco',
      options: [
        { label: 'GU10', value: 'attacco-gu10' },
        { label: 'E27', value: 'attacco-e27' },
        { label: 'E14', value: 'attacco-e14' },
        { label: 'GU5.3', value: 'attacco-gu53' },
        { label: 'R7s', value: 'attacco-r7s' },
        { label: 'G9', value: 'attacco-g9' },
        { label: 'T8', value: 'attacco-t8' },
      ],
    },
    {
      kind: 'chips',
      label: 'Kelvin',
      options: [
        { label: '2700K', value: 'kelvin-2700k' },
        { label: '3000K', value: 'kelvin-3000k' },
        { label: '4000K', value: 'kelvin-4000k' },
        { label: '6500K', value: 'kelvin-6500k' },
      ],
    },
    {
      kind: 'checkbox',
      label: 'Tecnologia',
      options: [
        { label: 'LED', value: 'tech-led', queryToken: 'LED' },
        { label: 'Alogena', value: 'tech-alogena', queryToken: 'alogena' },
        { label: 'Fluorescenza', value: 'tech-fluorescenza', queryToken: 'fluorescente' },
      ],
    },
    {
      kind: 'chips',
      label: 'Tensione di uscita',
      options: [
        { label: '12V', value: 'volt-12', queryToken: '12V' },
        { label: '24V', value: 'volt-24', queryToken: '24V' },
        { label: '220-240V', value: 'volt-230', queryToken: '230V' },
      ],
    },
    {
      kind: 'chips',
      label: 'Potenza',
      options: [
        { label: '≤ 10W', value: 'power-10', queryToken: '10W' },
        { label: '10-30W', value: 'power-30', queryToken: '30W' },
        { label: '30-60W', value: 'power-60', queryToken: '60W' },
        { label: '60-100W', value: 'power-100', queryToken: '100W' },
        { label: '100W+', value: 'power-100plus', queryToken: '100W' },
      ],
    },
    {
      kind: 'chips',
      label: 'Uscita corrente',
      options: [
        { label: '350mA', value: 'curr-350', queryToken: '350mA' },
        { label: '500mA', value: 'curr-500', queryToken: '500mA' },
        { label: '700mA', value: 'curr-700', queryToken: '700mA' },
        { label: '1050mA', value: 'curr-1050', queryToken: '1050mA' },
      ],
    },
    {
      kind: 'chips',
      label: 'Protezione IP',
      options: [
        { label: 'IP20', value: 'ip-20', queryToken: 'IP20' },
        { label: 'IP44', value: 'ip-44', queryToken: 'IP44' },
        { label: 'IP67', value: 'ip-67', queryToken: 'IP67' },
      ],
    },
    {
      kind: 'checkbox',
      label: 'Marca',
      options: [
        { label: 'TLB', value: 'brand-tlb' },
        { label: 'Mean Well', value: 'brand-mean-well' },
        { label: 'Vossloh', value: 'brand-vossloh' },
        { label: 'Osram', value: 'brand-osram' },
      ],
    },
    {
      kind: 'checkbox',
      label: 'Disponibilità',
      options: [
        { label: 'Pronta consegna', value: 'stock-in' },
        { label: 'Su ordinazione', value: 'stock-order' },
      ],
    },
  ],
  sortLabel: 'Ordina:',
  sortValue: 'Prezzo crescente',
  tips: {
    title: "Come scegliere l'alimentatore giusto",
    subtitle: 'Tre cose da verificare prima di acquistare un alimentatore o driver LED.',
    cards: [
      {
        eyebrow: '01 · TENSIONE / CORRENTE',
        title: 'Tensione costante o corrente costante?',
        description:
          "Le strip LED 12/24V usano alimentatori a tensione costante. I moduli e i COB di potenza richiedono driver a corrente costante (350/500/700mA): controlla l'etichetta del LED.",
      },
      {
        eyebrow: '02 · POTENZA',
        title: 'Lascia un margine del 20%',
        description:
          'Somma i watt dei carichi e scegli un alimentatore con almeno il 20% di potenza in più: lavora più fresco e dura di più. Per 80W di strip, scegli un 100W.',
      },
      {
        eyebrow: '03 · IP E DIMMER',
        title: 'Ambiente e dimmerabilità',
        description:
          "Per esterni o bagno serve IP67. Se vuoi regolare l'intensità, verifica che alimentatore e dimmer siano compatibili (TRIAC, 0-10V o DALI).",
      },
    ],
  },
  cta: {
    title: "Non trovi l'alimentatore compatibile?",
    description:
      'Inviaci una foto del vecchio alimentatore, dei dati di targa o del codice: troviamo il ricambio corretto o un\'alternativa equivalente — anche per prodotti fuori produzione.',
    primaryCta: { label: 'Invia una foto', href: '/prodotto-non-trovato' },
    secondaryCta: { label: 'Cerca per EAN', href: '/negozio?world=technical' },
  },
  pageSize: 8,
}

export const DEFAULT_TECHNICAL_CATEGORY_IT: CategoryLandingContent = {
  ...TECHNICAL_BASE,
  breadcrumb: [{ label: 'Home', href: '/' }, { label: 'Illuminazione tecnica' }],
  title: 'Illuminazione tecnica',
  description:
    'Lampadine, alimentatori, driver e ricambi. Cerca per attacco, watt, Kelvin o codice EAN e trova subito il prodotto giusto.',
  subtypeChips: [
    { label: 'Tutti', active: true },
    { label: 'Per attacco', href: '/attacco' },
    { label: 'Lampadine', href: '/negozio?world=technical&q=lampadina' },
    { label: 'Alimentatori', href: '/categoria-prodotto/illuminazione-tecnica/prodotti-tecnici' },
    { label: 'Driver LED', href: '/negozio?world=technical&q=driver' },
    { label: 'Accessori', href: '/negozio?world=technical&q=accessori' },
  ],
}

export const DEFAULT_TECHNICAL_PRODUCTS_CATEGORY_IT: CategoryLandingContent = {
  ...TECHNICAL_BASE,
  breadcrumb: [
    { label: 'Home', href: '/' },
    { label: 'Illuminazione tecnica', href: '/categoria-prodotto/illuminazione-tecnica' },
    { label: 'Prodotti tecnici' },
  ],
  title: 'Prodotti tecnici',
  subtypeChips: [
    { label: 'Tutti', href: '/categoria-prodotto/illuminazione-tecnica' },
    { label: 'Lampadine', href: '/negozio?world=technical&q=lampadina' },
    { label: 'Alimentatori', active: true },
    { label: 'Driver LED', href: '/negozio?world=technical&q=driver' },
    { label: 'Trasformatori', href: '/negozio?world=technical&q=trasformatore' },
    { label: 'Starter', href: '/negozio?world=technical&q=starter' },
    { label: 'Portalampade', href: '/negozio?world=technical&q=portalampade' },
    { label: 'Dimmer', href: '/negozio?world=technical&q=dimmer' },
    { label: 'Accessori', href: '/negozio?world=technical&q=accessori' },
  ],
  searchQuery: 'alimentatore',
}

const DEFAULTS: Record<CategoryLandingKey, CategoryLandingContent> = {
  design: DEFAULT_DESIGN_CATEGORY_IT,
  technical: DEFAULT_TECHNICAL_CATEGORY_IT,
  'technical-products': DEFAULT_TECHNICAL_PRODUCTS_CATEGORY_IT,
}

export function getCategoryLandingContent(key: CategoryLandingKey): CategoryLandingContent {
  return DEFAULTS[key]
}
