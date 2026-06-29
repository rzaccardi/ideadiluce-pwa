import type { SiteLocale } from '../site/site.constants.js'
import type { ContentPageContent } from '../site/site.types.js'
import { LEGACY_EDITORIAL_GUIDES_I18N } from './legacy-editorial-guides.i18n.js'

export const LEGACY_EDITORIAL_GUIDE_SLUGS = [
  'luce-calda-o-fredda',
  'calipso-artemide-io-vengo-dalla-luna',
  'la-natura-trend-2024',
] as const

export type LegacyEditorialGuideSlug = (typeof LEGACY_EDITORIAL_GUIDE_SLUGS)[number]

export const LEGACY_EDITORIAL_GUIDE_REDIRECTS: Array<{ fromPath: string; toPath: string; reason: string }> = [
  {
    fromPath: '/2024/06/26/luce-calda-o-fredda',
    toPath: '/guide/luce-calda-o-fredda',
    reason: 'WordPress post → guida arredo PWA',
  },
  {
    fromPath: '/2024/06/04/calipso-artemide-io-vengo-dalla-luna',
    toPath: '/guide/calipso-artemide-io-vengo-dalla-luna',
    reason: 'WordPress post → guida arredo PWA',
  },
  {
    fromPath: '/2024/06/25/la-natura-trend-2024',
    toPath: '/guide/la-natura-trend-2024',
    reason: 'WordPress post → guida arredo PWA',
  },
]

const IT_CONTENT: Record<LegacyEditorialGuideSlug, ContentPageContent> = {
  'luce-calda-o-fredda': {
    layout: 'article',
    eyebrow: 'ARREDO · SHOP THE LOOK · GIUGNO 2024',
    title: 'Luce CALDA o FREDDA: la scelta illuminante',
    subtitle: 'Giochi di ruolo: come scegliere tra luce calda e fredda stanza per stanza.',
    intro:
      'La luce calda (2400–2700K) crea atmosfera accogliente; la fredda (4000–6500K) è più brillante e adatta a compiti visivi. In camera e soggiorno privilegia il caldo; in ufficio e cucina il neutro/freddo.',
    coverImage: {
      imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/copertina-articolo2.jpg',
      alt: 'Ambientazione domestica con luce calda e fredda',
      caption: 'Giochi di ruolo: la temperatura colore definisce l\'atmosfera di ogni stanza.',
    },
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'L\'illuminazione gioca un ruolo fondamentale nel creare l\'atmosfera perfetta in ogni ambiente della nostra casa. Ma come scegliere tra luce calda e fredda? La temperatura colore si misura in Kelvin (K): valori bassi danno un bagliore morbido e accogliente, simile a una candela o al sole al tramonto; valori alti ricordano la luce naturale del mattino, più energizzante.',
          'La luce calda, con una temperatura di colore tra 2400K e 2700K, emette un bagliore morbido e accogliente. La luce fredda, invece, ha una temperatura tra 4000K e 6500K: più brillante, ideale dove serve concentrazione e visibilità.',
        ],
      },
      {
        kind: 'image',
        layout: 'wide',
        imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/img_01.jpg',
        alt: 'Soggiorno illuminato con luce calda',
      },
      {
        kind: 'split',
        layout: 'image-right',
        imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/img-02-3.jpg',
        alt: 'Dettaglio lampada con temperatura colore neutra',
        paragraphs: [
          'La scelta della temperatura colore influenza la percezione dei materiali, delle finiture e persino il nostro benessere quotidiano. Valuta sempre la funzione della stanza prima di scegliere Kelvin e intensità luminosa.',
        ],
      },
      {
        kind: 'image',
        layout: 'inline',
        imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/img_04.jpg',
        alt: 'Bagno con combinazione di luce calda e fredda',
        caption: 'Nel bagno puoi alternare luce fredda per il trucco e calda per il relax serale.',
      },
      {
        kind: 'bullets',
        title: 'Le luci stanza per stanza',
        items: [
          'Camera da letto: privilegia la luce calda, soprattutto per le lampade da comodino, per favorire relax e sonno.',
          'Ufficio: la luce fredda migliora concentrazione e produttività.',
          'Cucina: molti preferiscono luce fredda o neutra per un aspetto pulito e una migliore visibilità durante la preparazione dei cibi.',
          'Bagno: puoi giocare con entrambe — fredda per trucco e rasatura, calda per un bagno serale rilassante.',
          'Sala da pranzo: la luce calda è perfetta per un\'atmosfera accogliente durante i pasti.',
        ],
      },
      {
        kind: 'cards',
        title: 'Ispirazioni',
        subtitle: 'Lampade d\'arredo per valorizzare la scelta di temperatura colore.',
        items: [
          {
            title: 'Alphabet of light',
            description: 'Composizione modulare Artemide per luce scenografica nel living.',
            href: '/negozio?world=design&q=Alphabet+of+light',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/alpha.jpg',
          },
          {
            title: 'Captain Flint',
            description: 'Piantana Flos con luce calda regolabile per angoli lettura.',
            href: '/negozio?world=design&q=Captain+Flint',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/capflin.jpg',
          },
          {
            title: 'Lampara',
            description: 'Sospensione dal carattere caldo per zona pranzo o ingresso.',
            href: '/negozio?world=design&q=Lampara',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/lampara.jpg',
          },
          {
            title: 'Bolla',
            description: 'Vetro soffiato e luce diffusa per atmosfere morbide.',
            href: '/negozio?world=design&q=Bolla',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/bolla1.jpg',
          },
        ],
      },
      {
        kind: 'cta',
        title: 'Cerchi lampadine o lampade per temperatura colore?',
        primaryLabel: 'Esplora illuminazione d\'arredo →',
        primaryHref: '/categoria-prodotto/illuminazione-arredo',
        variant: 'accent',
      },
    ],
    cta: { label: 'Tutte le guide arredo →', href: '/guide' },
  },

  'calipso-artemide-io-vengo-dalla-luna': {
    layout: 'article',
    eyebrow: 'ARREDO · DESIGN SPOTLIGHT · GIUGNO 2024',
    title: 'CALIPSO – Designed by Artemide',
    subtitle: 'Io vengo dalla luna: geometria frattale, comfort visivo e luce emozionale.',
    intro:
      'Calipso di Artemide nasce da un algoritmo: cerchi luminosi organici che diffondono luce confortevole e creano un\'atmosfera unica, perfetta per living, ingressi e zone conviviali.',
    coverImage: {
      imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso-up2.jpg',
      alt: 'Sospensione Calipso Artemide in ambiente living',
      caption: 'Io vengo dalla luna: la geometria frattale di Calipso cattura la bellezza lunare.',
    },
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Un\'emozione luminosa prende forma con Artemide Calipso, un\'opera d\'arte di design che cattura la bellezza lunare. Nata da un algoritmo, la sua geometria frattale crea un insieme organico di cerchi luminosi, offrendo un comfort visivo ottimale e un\'atmosfera unica.',
          'Perfetta per ogni ambiente, Calipso fonde alte prestazioni ed espressività unica, tratto distintivo dell\'illuminazione di design Artemide. Con Calipso, la luce diventa emozione: la tecnologia si fonde con l\'arte e la luna entra in casa tua.',
        ],
      },
      {
        kind: 'image',
        layout: 'full',
        imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/img-00.jpg',
        alt: 'Calipso sospesa sopra un tavolo da pranzo',
      },
      {
        kind: 'split',
        layout: 'image-left',
        imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/Neil-Poulton2.jpg',
        alt: 'Neil Poulton, designer di Calipso',
        title: 'Neil Poulton',
        paragraphs: [
          'Neil Poulton, designer scozzese pluripremiato con base a Parigi, è celebre per progetti minimalisti ma tecnologicamente avanzati. Specializzato in oggetti dal design "ingannevolmente semplice", collabora da anni con Artemide e altre aziende leader del design.',
        ],
      },
      {
        kind: 'image',
        layout: 'wide',
        imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/img-03-1.jpg',
        alt: 'Dettaglio della superficie luminosa di Calipso',
        caption: 'Micro-superfici e cerchi luminosi per un comfort visivo ottimale.',
      },
      {
        kind: 'prose',
        paragraphs: [
          'Scopri come tecnologia e design si fondono per un\'esperienza luminosa indimenticabile. Lasciati ispirare dalla magia di Calipso e trasforma i tuoi spazi con la sua luce avvolgente.',
        ],
      },
      {
        kind: 'features',
        title: 'Neil Poulton',
        items: [
          {
            title: 'Designer',
            description:
              'Neil Poulton, designer scozzese pluripremiato con base a Parigi, è celebre per progetti minimalisti ma tecnologicamente avanzati. Specializzato in oggetti dal design "ingannevolmente semplice", collabora da anni con Artemide e altre aziende leader.',
          },
          {
            title: 'Filosofia',
            description:
              'Forme essenziali, materiali ricercati e innovazione luminosa: ogni prodotto nasce per integrarsi negli ambienti quotidiani senza rinunciare all\'identità scultorea.',
          },
        ],
      },
      {
        kind: 'cards',
        title: 'I prodotti di Neil Poulton',
        subtitle: 'Scopri Calipso e altre icone del designer per Artemide.',
        items: [
          {
            title: 'Calipso',
            description: 'Sospensione iconica con geometria frattale e luce diffusa.',
            href: '/negozio?world=design&q=Calipso',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso.jpg',
          },
          {
            title: 'Microsurf',
            description: 'Lampada da tavolo compatta con luce diretta e riflessa.',
            href: '/negozio?world=design&q=Microsurf',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/microsurf.jpg',
          },
          {
            title: 'Talo',
            description: 'Linea essenziale per scrivanie e comodini contemporanei.',
            href: '/negozio?world=design&q=Talo+Artemide',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/talo.jpg',
          },
          {
            title: 'Rea',
            description: 'Applique o lampada da parete dal profilo sottile.',
            href: '/negozio?world=design&q=Rea+Artemide',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/rea.jpg',
          },
        ],
      },
      {
        kind: 'cta',
        title: 'Esplora tutta la collezione Artemide',
        primaryLabel: 'Vedi brand Artemide →',
        primaryHref: '/brand/artemide',
        variant: 'accent',
      },
    ],
    cta: { label: 'Altre ispirazioni d\'arredo →', href: '/categoria-prodotto/illuminazione-arredo' },
  },

  'la-natura-trend-2024': {
    layout: 'article',
    eyebrow: 'ARREDO · STYLE RADAR · GIUGNO 2024',
    title: 'Lighting trends 2024 – LA NATURA',
    subtitle: 'La natura entra in casa: forme organiche, materiali naturali e luce poetica.',
    intro:
      'Il design 2024 celebra alveari, flussi d\'acqua e sagome montuose: lampade organiche, finiture Wabi-Sabi e composizioni modulari portano un tocco naturale negli ambienti domestici.',
    coverImage: {
      imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/copertina.jpg',
      alt: 'Trend illuminazione 2024 ispirati alla natura',
      caption: 'La natura entra in casa: forme organiche e materiali naturali.',
    },
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'La natura è la musa ispiratrice del design 2024, e l\'illuminazione non fa eccezione. Ispirandosi alla bellezza di alveari, al flusso dell\'acqua o alle sagome delle montagne, le lampade di design di quest\'anno portano un tocco di natura negli ambienti domestici. Dimenticate le linee rigide: il 2024 celebra forme organiche e materiali naturali.',
        ],
      },
      {
        kind: 'gallery',
        title: 'Forme organiche in luce',
        items: [
          {
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/img-01-1.jpg',
            alt: 'Lampada con forme organiche in soggiorno',
          },
          {
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/img-02-2.jpg',
            alt: 'Dettaglio materiale naturale e luce diffusa',
          },
          {
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/luna_parete.jpg',
            alt: 'Applique con richiamo lunare',
          },
        ],
      },
      {
        kind: 'prose',
        paragraphs: [
          'Chlorophilia, firmata da Ross Lovegrove, è una scultura luminosa che reinterpreta l\'expertise Artemide in chiave organica e fluida. La sua leggerezza si rivela quando è accesa, con un suggestivo gioco di ombre: il corpo centrale diffonde luce indiretta filtrata da tre elementi trasparenti a forma di foglia.',
          'L\'estetica Wabi-Sabi, che celebra l\'imperfezione e la bellezza dell\'invecchiamento, è un\'altra tendenza forte: finiture anticate, materiali grezzi e forme imperfette aggiungono carattere agli ambienti.',
          'Yanzi di Artemide è un equilibrio di tradizione e innovazione: rami in ottone spazzolato sostengono rondini stilizzate con teste in vetro bianco che racchiudono la luce. Un sistema aperto per composizioni personalizzate e paesaggi luminosi unici.',
        ],
      },
      {
        kind: 'cards',
        title: 'Ispirati dalla natura',
        subtitle: 'Selezione di lampade organiche e composizioni scenografiche.',
        items: [
          {
            title: 'Chlorophilia',
            description: 'Scultura luminosa di Ross Lovegrove con foglie in vetro.',
            href: '/negozio?world=design&q=Chlorophilia',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/chloro.jpg',
          },
          {
            title: 'Yanzi',
            description: 'Sistema modulare con rondini in vetro e ottone spazzolato.',
            href: '/negozio?world=design&q=Yanzi',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/yanzi.jpg',
          },
          {
            title: 'Calipso',
            description: 'Geometria frattale ispirata alla superficie lunare.',
            href: '/negozio?world=design&q=Calipso',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/06/calipso-up2.jpg',
          },
          {
            title: 'UOVO',
            description: 'Forma organica in vetro soffiato per luce morbida.',
            href: '/negozio?world=design&q=Uovo+Artemide',
            imageUrl: 'https://ideadiluce.com/wp-content/uploads/2024/07/uovo.jpg',
          },
        ],
      },
      {
        kind: 'cta',
        title: 'Scopri l\'illuminazione d\'arredo',
        primaryLabel: 'Vai alla categoria arredo →',
        primaryHref: '/categoria-prodotto/illuminazione-arredo',
        variant: 'accent',
      },
    ],
    cta: { label: 'Tutte le guide →', href: '/guide' },
  },
}

export function legacyEditorialGuidePageKey(slug: LegacyEditorialGuideSlug) {
  return `guide-${slug}` as const
}

function syncArticleMedia(target: ContentPageContent, source: ContentPageContent): ContentPageContent {
  const merged = structuredClone(target)

  if (source.coverImage) {
    merged.coverImage = {
      ...source.coverImage,
      alt: target.coverImage?.alt ?? source.coverImage.alt,
      caption: target.coverImage?.caption ?? source.coverImage.caption,
    }
  }

  const sourceBlocks = source.blocks ?? []
  const targetBlocks = merged.blocks ?? []
  merged.blocks = targetBlocks.map((block, index) => {
    const sourceBlock = sourceBlocks[index]
    if (!sourceBlock || block.kind !== sourceBlock.kind) return block

    if (block.kind === 'image' && sourceBlock.kind === 'image') {
      return {
        ...block,
        imageUrl: sourceBlock.imageUrl,
        layout: sourceBlock.layout,
        alt: block.alt ?? sourceBlock.alt,
        caption: block.caption ?? sourceBlock.caption,
      }
    }

    if (block.kind === 'split' && sourceBlock.kind === 'split') {
      return {
        ...block,
        imageUrl: sourceBlock.imageUrl,
        layout: sourceBlock.layout,
        alt: block.alt ?? sourceBlock.alt,
        caption: block.caption ?? sourceBlock.caption,
      }
    }

    if (block.kind === 'gallery' && sourceBlock.kind === 'gallery') {
      return {
        ...block,
        items: block.items.map((item, itemIndex) => ({
          ...item,
          imageUrl: sourceBlock.items[itemIndex]?.imageUrl ?? item.imageUrl,
          alt: item.alt ?? sourceBlock.items[itemIndex]?.alt,
          caption: item.caption ?? sourceBlock.items[itemIndex]?.caption,
        })),
      }
    }

    if (block.kind === 'cards' && sourceBlock.kind === 'cards') {
      return {
        ...block,
        items: block.items.map((item, itemIndex) => ({
          ...item,
          imageUrl: sourceBlock.items[itemIndex]?.imageUrl ?? item.imageUrl,
          href: sourceBlock.items[itemIndex]?.href ?? item.href,
        })),
      }
    }

    return block
  })

  if (targetBlocks.length < sourceBlocks.length) {
    merged.blocks = [...merged.blocks, ...sourceBlocks.slice(targetBlocks.length)]
  }

  return merged
}

export function getLegacyEditorialGuideContent(
  slug: LegacyEditorialGuideSlug,
  locale: SiteLocale,
): ContentPageContent {
  const italian = IT_CONTENT[slug]
  if (locale === 'IT') {
    return structuredClone(italian)
  }
  const translated = LEGACY_EDITORIAL_GUIDES_I18N[locale]?.[slug]
  const base = translated ? structuredClone(translated) : structuredClone(italian)
  return syncArticleMedia(base, italian)
}
