export type AmbientiRoomGroup = 'casa' | 'esterno' | 'professionale'

export type AmbientiRoomTag = {
  label: string
  href: string
}

export type AmbientiRoomMeta = {
  slug: string
  description: string
  intro?: string
  tags: AmbientiRoomTag[]
  kelvinTip: string
  kelvinWarning?: boolean
  group: AmbientiRoomGroup
}

export type AmbientiLookProduct = {
  id: number
  title: string
  subtitle: string
  price: string
  visible: boolean
  href: string
}

export type AmbientiHotspot = {
  id: number
  left: string
  top: string
  delay: string
  badge: string
  title: string
  subtitle: string
  spec: string
  price: string
  href: string
}

export type AmbientiPopularLook = {
  title: string
  subtitle: string
  imageUrl: string
  productCount: number
  fromPrice: string
  href: string
}

export const AMBIENTI_HERO = {
  eyebrow: 'SHOP BY ROOM · SHOP THE LOOK',
  h1: 'Ambienti',
  title: 'Trova la luce giusta per ogni ambiente',
  subtitle:
    'Scegli uno spazio, lasciati ispirare da ambienti reali e scopri i prodotti — e i componenti necessari — per ricreare lo stesso effetto luminoso a casa tua.',
  primaryCta: { label: 'Esplora gli ambienti', href: '#ambienti' },
  secondaryCta: { label: 'Guarda i look', href: '#shop-the-look' },
}

export const AMBIENTI_ROOM_GROUPS: { id: AmbientiRoomGroup; label: string }[] = [
  { id: 'casa', label: 'Casa' },
  { id: 'esterno', label: 'Esterno' },
  { id: 'professionale', label: 'Professionale' },
]

export const AMBIENTI_ROOM_META: AmbientiRoomMeta[] = [
  {
    slug: 'soggiorno',
    group: 'casa',
    description: "Luce d'atmosfera, lettura e relax per un ambiente caldo e accogliente.",
    intro:
      'Per illuminare un soggiorno servono luce generale, punti per la lettura e una componente d\'atmosfera: in media 3.000–4.000 lumen totali distribuiti su più fonti.',
    tags: [
      { label: 'Piantane', href: '/tipologia/terra' },
      { label: 'Applique', href: '/tipologia/parete' },
      { label: 'Strisce LED', href: '/negozio?category=strip' },
      { label: 'Accessori', href: '/negozio?category=accessori' },
    ],
    kelvinTip: '2700–3000K consigliati',
  },
  {
    slug: 'cucina',
    group: 'casa',
    description: 'Luce funzionale per cucinare, valorizzare isola e tavolo, illuminare il piano lavoro.',
    tags: [
      { label: 'Sospensioni', href: '/tipologia/sospensione' },
      { label: 'Faretti', href: '/tipologia/incasso' },
      { label: 'Strisce LED', href: '/negozio?category=strip' },
      { label: 'LED', href: '/negozio?category=led' },
    ],
    kelvinTip: '3000K isola · 4000K lavoro',
  },
  {
    slug: 'bagno',
    group: 'casa',
    description: 'Luce sicura e uniforme per specchio, lavabo, doccia e soffitto.',
    tags: [
      { label: 'Applique', href: '/tipologia/parete' },
      { label: 'Plafoniere', href: '/tipologia/plafoniere' },
      { label: 'Faretti', href: '/tipologia/incasso' },
    ],
    kelvinTip: 'Controlla il grado IP',
    kelvinWarning: true,
  },
  {
    slug: 'camera',
    group: 'casa',
    description: 'Luce soft e rilassante: abat-jour, applique e LED dietro la testata.',
    tags: [
      { label: 'Tavolo', href: '/tipologia/tavolo' },
      { label: 'Applique', href: '/tipologia/parete' },
      { label: 'Strisce LED', href: '/negozio?category=strip' },
    ],
    kelvinTip: '2700K · dimmerabile',
  },
  {
    slug: 'studio',
    group: 'casa',
    description: 'Luce neutra e comfort visivo per leggere e lavorare senza affaticare.',
    tags: [
      { label: 'Lampade da tavolo', href: '/tipologia/tavolo' },
      { label: 'Faretti', href: '/tipologia/incasso' },
    ],
    kelvinTip: '4000K · CRI >90',
  },
  {
    slug: 'esterno',
    group: 'esterno',
    description: 'Giardino, ingresso, vialetto e terrazzo con prodotti resistenti e scenografici.',
    tags: [
      { label: 'Applique', href: '/negozio?category=arredo&tipologia=parete&stile=outdoor' },
      { label: 'Outdoor', href: '/stile/outdoor' },
      { label: 'Speciali', href: '/negozio?category=speciali' },
      { label: 'LED', href: '/negozio?category=led' },
    ],
    kelvinTip: 'IP65 / IP67 · sensore',
    kelvinWarning: true,
  },
]

export const AMBIENTI_SHOP_THE_LOOK = {
  title: 'Cucina moderna con isola',
  subtitle:
    'Tocca i punti luce per scoprire i prodotti usati nella scena — e i componenti necessari per installarli.',
  imageUrl: '/site/images/look-cucina.webp',
  tip: 'Usa 4000K sul piano lavoro per vedere bene i colori dei cibi e 3000K su tavolo e isola per un\'atmosfera più accogliente.',
  total: '€ 232',
  products: [
    {
      id: 1,
      title: 'Sospensione nera sopra isola',
      subtitle: 'Visibile nella foto · E27',
      price: '€ 129',
      visible: true,
      href: '/tipologia/sospensione',
    },
    {
      id: 2,
      title: 'Striscia LED 24V 4000K sottopensile',
      subtitle: 'Visibile · 14,4W/m',
      price: '€ 39',
      visible: true,
      href: '/negozio?category=strip',
    },
    {
      id: 3,
      title: 'Profilo LED angolare 2m',
      subtitle: 'Necessario per installare',
      price: '€ 22',
      visible: false,
      href: '/negozio?category=accessori',
    },
    {
      id: 4,
      title: 'Alimentatore 24V 100W',
      subtitle: 'Necessario · non visibile',
      price: '€ 42',
      visible: false,
      href: '/negozio?category=driver',
    },
  ] satisfies AmbientiLookProduct[],
  hotspots: [
    {
      id: 1,
      left: '38%',
      top: '26%',
      delay: '0s',
      badge: 'VISIBILE NELLA FOTO',
      title: 'Sospensione nera sopra isola',
      subtitle: 'Lampada a sospensione in metallo · attacco E27',
      spec: 'Consigliata con E27 3000K',
      price: '€ 129',
      href: '/tipologia/sospensione',
    },
    {
      id: 2,
      left: '64%',
      top: '58%',
      delay: '0.5s',
      badge: 'VISIBILE NELLA FOTO',
      title: 'Striscia LED 24V sottopensile',
      subtitle: 'Striscia LED 24V · 14,4W/m · IP20',
      spec: 'Serve alimentatore 24V compatibile',
      price: '€ 39',
      href: '/negozio?category=strip',
    },
    {
      id: 3,
      left: '22%',
      top: '64%',
      delay: '1s',
      badge: 'NECESSARIO',
      title: 'Profilo LED angolare 2m',
      subtitle: 'Profilo in alluminio con diffusore opale',
      spec: 'Nasconde la striscia, elimina i puntini',
      price: '€ 22',
      href: '/negozio?category=accessori',
    },
    {
      id: 4,
      left: '80%',
      top: '34%',
      delay: '1.5s',
      badge: 'NECESSARIO',
      title: 'Alimentatore LED 24V 100W',
      subtitle: 'Trasformatore per strisce LED 24V',
      spec: 'Dimensionato sul consumo totale + 20%',
      price: '€ 42',
      href: '/negozio?category=driver',
    },
  ] satisfies AmbientiHotspot[],
}

export const AMBIENTI_POPULAR_LOOKS: AmbientiPopularLook[] = [
  {
    title: 'Soggiorno caldo e rilassante',
    subtitle: 'Atmosfera · Lettura · Luce indiretta',
    imageUrl: '/site/images/lk-1.webp',
    productCount: 5,
    fromPrice: '€ 249',
    href: '/ambienti/soggiorno',
  },
  {
    title: 'Bagno con specchio illuminato',
    subtitle: 'Specchio · IP44 · Anti-abbagliamento',
    imageUrl: '/site/images/lk-2.webp',
    productCount: 4,
    fromPrice: '€ 179',
    href: '/ambienti/bagno',
  },
  {
    title: 'Camera soft con LED testata',
    subtitle: 'Relax · 2700K · Dimmerabile',
    imageUrl: '/site/images/lk-3.webp',
    productCount: 4,
    fromPrice: '€ 159',
    href: '/ambienti/camera',
  },
  {
    title: 'Vialetto con segnapasso',
    subtitle: 'Esterno · IP65 · Sensore',
    imageUrl: '/site/images/lk-4.webp',
    productCount: 6,
    fromPrice: '€ 320',
    href: '/ambienti/esterno',
  },
]

export const AMBIENTI_CONSULT_CTA = {
  title: 'Hai un ambiente da illuminare?',
  description:
    "Caricaci una foto della stanza o del giardino: ti proponiamo un look completo, con prodotti visibili e componenti necessari per ottenere l'effetto che cerchi.",
  primaryCta: { label: 'Carica una foto', href: '/prodotto-non-trovato' },
  secondaryCta: { label: 'Richiedi consulenza', href: '/contatti' },
}

export function roomSlugFromHref(href: string): string | null {
  try {
    const url = new URL(href, 'https://ideadiluce.local')
    const category = url.searchParams.get('category')
    if (category) return category
    const parts = url.pathname.split('/').filter(Boolean)
    const ambientiIndex = parts.indexOf('ambienti')
    if (ambientiIndex >= 0 && parts[ambientiIndex + 1]) return parts[ambientiIndex + 1]
  } catch {
    return null
  }
  return null
}

export function getAmbientiRoomMeta(slug: string | null): AmbientiRoomMeta | undefined {
  if (!slug) return undefined
  return AMBIENTI_ROOM_META.find((room) => room.slug === slug)
}
