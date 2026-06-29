import type { ContentPageContent } from './site.types.js'
import { getStorePickupLocation } from '../../config/store-location.js'
import { getLegacyEditorialGuideContent } from '../site-guides/legacy-editorial-guides.content.js'
import { DEFAULT_TERMINI_IT } from './site-content-termini.defaults.js'

const pickup = getStorePickupLocation()

/** Dati aziendali condivisi (footer / contatti). */
export const COMPANY_CONTACT = {
  company: 'TLB ITALY Srl',
  vat: 'IT17245551001',
  rea: 'RM-1705840',
  address: `${pickup.displayAddress} (Italy)`,
  phone: '+39 06 716 7111',
  phoneHref: 'tel:+39067167111',
  email: 'info@ideadiluce.com',
  hours: 'Lunedì – Venerdì · 9.00 – 13.00 · 15.00 – 18.00',
  whatsapp: 'https://wa.me/39067167111',
}

export const CONTENT_PAGE_KEYS = [
  'chi-siamo',
  'showroom',
  'lavora-con-noi',
  'spedizioni',
  'pagamenti',
  'garanzia',
  'contatti',
  'privacy',
  'cookie',
  'termini',
  'prodotto-non-trovato',
  'guide-luce-calda-naturale-fredda',
  'guide-luce-calda-o-fredda',
  'guide-calipso-artemide-io-vengo-dalla-luna',
  'guide-la-natura-trend-2024',
  'guide-gu10-gu53',
  'guide-lampadina-r7s',
  'guide-illuminare-soggiorno',
  'guide-glossario',
  'guide-scegliere-lampadina-led',
  'guide-alimentatore-striscia-led',
] as const

export type ContentPageKey = (typeof CONTENT_PAGE_KEYS)[number]

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

export const CONTENT_PAGE_DEFAULTS: Record<ContentPageKey, ContentPageContent> = {
  'chi-siamo': {
    title: 'Chi siamo',
    subtitle: 'Passione per la luce, dal 1998.',
    intro:
      'Idea di Luce è il punto di riferimento per illuminazione d\'arredo e prodotti tecnici: showroom a Roma, e-commerce e assistenza reale per privati e professionisti.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Da oltre 25 anni selezioniamo brand di design e componentistica tecnica, con un catalogo che unisce arredo e ricambi difficili da trovare.',
          'Il nostro team ti aiuta a scegliere lampade, lampadine e accessori — anche quando hai solo una foto dell\'attacco o un codice poco leggibile.',
        ],
      },
      {
        kind: 'features',
        items: [
          { num: '01', title: 'Showroom a Roma', description: 'Vieni a vedere dal vivo lampade e materiali.' },
          { num: '02', title: 'Catalogo arredo + tecnico', description: 'Design e ricambi nello stesso posto.' },
          { num: '03', title: 'Assistenza umana', description: 'Telefono, email e WhatsApp con persone vere.' },
          { num: '04', title: 'Spedizione tracciata', description: 'Consegna in tutta Italia.' },
        ],
      },
      {
        kind: 'contact',
        ...COMPANY_CONTACT,
      },
    ],
    cta: { label: 'Visita lo showroom →', href: '/showroom' },
  },

  showroom: {
    layout: 'hero-dark',
    eyebrow: 'SHOWROOM · ROMA',
    title: 'Vieni a trovarci dal vivo',
    subtitle: 'Consulenza, prodotti esposti e supporto per privati e professionisti.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Nel nostro showroom puoi vedere lampade, materiali e campioni di attacco. Ti aiutiamo a scegliere la soluzione giusta per casa, negozio o cantiere.',
        ],
      },
      { kind: 'contact', ...COMPANY_CONTACT },
      {
        kind: 'cta',
        title: 'Prenota una visita',
        description: 'Scrivici per fissare un appuntamento o passa negli orari di apertura.',
        primaryLabel: 'Contattaci',
        primaryHref: '/contatti',
        secondaryLabel: 'Vai al negozio',
        secondaryHref: '/negozio',
      },
    ],
  },

  'lavora-con-noi': {
    title: 'Lavora con noi',
    subtitle: 'Unisciti al team Idea di Luce.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Cerchiamo persone appassionate di illuminazione, e-commerce e assistenza clienti. Se vuoi lavorare con noi, inviaci il tuo CV.',
        ],
      },
      {
        kind: 'lead-form',
        form: 'contact',
        title: 'Candidati',
        description: 'Raccontaci chi sei e che ruolo ti interessa.',
      },
      { kind: 'contact', ...COMPANY_CONTACT },
    ],
  },

  spedizioni: {
    layout: 'legal',
    title: 'Spedizioni e resi',
    subtitle: 'Informazioni su consegna, tracking e reso merce.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Spediamo in tutta Italia con corriere tracciato. Riceverai email con il link di tracking non appena il pacco lascia il nostro magazzino.',
          'I tempi di consegna indicati in checkout sono indicativi e possono variare per prodotti su ordinazione o isole.',
          'Per resi e recesso, contattaci entro 14 giorni dalla consegna: ti guideremo nella procedura e verificheremo lo stato del prodotto.',
        ],
      },
      {
        kind: 'cta',
        title: 'Hai domande sulla spedizione?',
        primaryLabel: 'Contattaci',
        primaryHref: '/contatti',
        variant: 'light',
      },
    ],
  },

  pagamenti: {
    layout: 'legal',
    title: 'Pagamenti',
    subtitle: 'Metodi accettati e sicurezza delle transazioni.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Accettiamo carte di credito e debito tramite Stripe (Visa, Mastercard, American Express), Apple Pay e Google Pay dove disponibili.',
          'Per account business verificati è disponibile il pagamento con bonifico bancario anticipato, con fattura elettronica.',
          'Tutti i pagamenti con carta sono processati su connessione sicura; non memorizziamo i dati completi della carta sui nostri server.',
        ],
      },
    ],
  },

  garanzia: {
    layout: 'legal',
    title: 'Garanzia',
    subtitle: 'Copertura legale e assistenza post-vendita.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'I prodotti sono coperti dalla garanzia legale di conformità prevista dal Codice del Consumo.',
          'Per difetti o non conformità, contattaci con numero ordine e foto del prodotto: valuteremo riparazione, sostituzione o rimborso secondo la normativa vigente.',
          'Per lampadine e componenti elettronici, verifica sempre compatibilità attacco, watt e tensione prima dell\'installazione.',
        ],
      },
      {
        kind: 'cta',
        title: 'Serve assistenza su un ordine?',
        primaryLabel: 'Scrivici',
        primaryHref: '/contatti',
        variant: 'light',
      },
    ],
  },

  contatti: {
    title: 'Contatti',
    subtitle: 'Siamo qui per aiutarti a scegliere la luce giusta.',
    blocks: [
      {
        kind: 'features',
        items: [
          { title: 'Assistenza reale', description: 'Ti aiutiamo a scegliere' },
          { title: 'Showroom Roma', description: 'Vieni a trovarci dal vivo' },
          { title: 'Ricambi difficili', description: 'Foto, EAN o codice prodotto' },
          { title: 'Spedizione tracciata', description: 'In tutta Italia' },
        ],
      },
      { kind: 'contact', ...COMPANY_CONTACT },
      {
        kind: 'lead-form',
        form: 'contact',
        title: 'Scrivici',
        description: 'Compila il modulo: ti rispondiamo il prima possibile negli orari di ufficio.',
      },
      {
        kind: 'cta',
        title: 'Non trovi un prodotto?',
        description: 'Invia foto o codice: ti aiutiamo a trovare il ricambio.',
        primaryLabel: 'Richiedi supporto →',
        primaryHref: '/prodotto-non-trovato',
        variant: 'accent',
      },
    ],
  },

  privacy: {
    layout: 'legal',
    title: 'Privacy Policy',
    subtitle: 'Informativa sul trattamento dei dati personali.',
    intro:
      'TLB ITALY S.r.l., titolare del trattamento, utilizza i dati forniti per gestire ordini, account e assistenza clienti.',
    seo: { noindex: false },
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'TLB ITALY Srl (P.IVA IT17245551001), titolare del trattamento, utilizza i dati forniti per gestire ordini, account, assistenza clienti e — previo consenso — comunicazioni marketing.',
          'I dati di pagamento sono trattati da Stripe secondo la propria informativa. Conserviamo i dati ordine per gli obblighi fiscali e contabili.',
          'Puoi esercitare i diritti previsti dal GDPR (accesso, rettifica, cancellazione, limitazione, opposizione) scrivendo a info@ideadiluce.com.',
        ],
      },
    ],
  },

  cookie: {
    layout: 'legal',
    title: 'Cookie Policy',
    subtitle: 'Uso dei cookie e tecnologie simili.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Utilizziamo cookie tecnici necessari al funzionamento del sito (sessione, carrello, preferenze lingua).',
          'Cookie analitici e di marketing sono attivati solo previo consenso tramite il banner cookie.',
          'Puoi gestire le preferenze dal browser o contattarci per maggiori informazioni.',
        ],
      },
    ],
  },

  termini: DEFAULT_TERMINI_IT,

  'prodotto-non-trovato': {
    layout: 'hero-dark',
    eyebrow: 'ON DEMAND · IDEA DI LUCE',
    title: 'On Demand',
    subtitle:
      'Se non trovi il prodotto desiderato nel nostro catalogo online, contattaci: compila il form con i dettagli e faremo del nostro meglio per procurartelo. Meriti la luce migliore e siamo qui per aiutarti a trovarla.',
    heroBadges: ['Risposta in giornata', 'Showroom a Roma', '25+ anni di esperienza'],
    blocks: [
      {
        kind: 'lead-form',
        form: 'product-not-found',
        title: 'Contattaci ora! Siamo solo a un modulo di distanza.',
        description: 'Indicaci cosa ti serve e il nostro team si metterà al lavoro per te.',
      },
      {
        kind: 'steps',
        title: 'Come funziona',
        items: [
          { title: 'Invii foto o codice', description: 'Anche solo una foto della vecchia lampadina basta.' },
          { title: 'Identifichiamo il prodotto', description: 'Un tecnico verifica attacco, misure e compatibilità.' },
          { title: 'Ti proponiamo la soluzione', description: 'Il ricambio esatto o un\'alternativa equivalente, con prezzo.' },
        ],
      },
      { kind: 'contact', ...COMPANY_CONTACT },
    ],
  },

  'guide-luce-calda-naturale-fredda': {
    layout: 'article',
    eyebrow: 'GUIDA BASE · 5 MIN',
    title: 'Luce calda, naturale o fredda?',
    subtitle: 'La differenza tra 2700K, 3000K, 4000K e 6500K e quale scegliere per ogni stanza.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'La temperatura colore si misura in Kelvin (K): valori bassi (2700–3000K) danno luce calda e accogliente, ideali per soggiorno e camera.',
          '4000K è una luce naturale neutra, adatta a cucina e studio. 6500K è luce fredda da ufficio o laboratorio.',
          'Per ambienti living scegli 2700–3000K; in cucina 3000–4000K; evita luce fredda in zone relax.',
        ],
      },
      {
        kind: 'cta',
        title: 'Cerca lampadine per temperatura colore',
        primaryLabel: 'Vai al negozio tecnico →',
        primaryHref: '/negozio?world=technical&q=2700K',
        variant: 'accent',
      },
    ],
  },

  'guide-gu10-gu53': {
    layout: 'article',
    eyebrow: 'ATTACCHI · 4 MIN',
    title: 'GU10 o GU5.3: qual è la differenza?',
    subtitle: 'Due attacchi simili ma non intercambiabili: tensione, forma e utilizzo.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'GU10 lavora a 230V ed è comune in faretti da incasso e applique. GU5.3 (MR16) lavora a 12V e richiede un trasformatore o alimentatore.',
          'Non inserire mai una lampadina 230V in un portalampade 12V (e viceversa): rischio danno e pericolo.',
          'Controlla sempre la marcatura sul portalampade esistente o misura con un tecnico.',
        ],
      },
      {
        kind: 'cards',
        title: 'Esplora per attacco',
        items: [
          { title: 'GU10', description: '230V bispina', href: '/negozio?world=technical&q=GU10' },
          { title: 'GU5.3', description: '12V MR16', href: '/negozio?world=technical&q=GU5.3' },
        ],
      },
    ],
  },

  'guide-lampadina-r7s': {
    layout: 'article',
    eyebrow: 'ACQUISTO · 6 MIN',
    title: 'Come scegliere una lampadina R7s',
    subtitle: 'Lunghezza, watt e retrofit per lampade lineari.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'L\'attacco R7s è lineare: la misura critica è la lunghezza (es. 78 mm o 118 mm). Verifica quella della lampada esistente.',
          'Controlla watt massimo ammesso dal portalampade e se preferisci alogena o LED retrofit.',
          'Se non sei sicuro, inviaci una foto del portalampade: ti indichiamo il codice corretto.',
        ],
      },
      {
        kind: 'cta',
        title: 'Cerca R7s nel negozio',
        primaryLabel: 'Vedi prodotti R7s →',
        primaryHref: '/negozio?world=technical&q=R7s',
        variant: 'accent',
      },
    ],
  },

  'guide-illuminare-soggiorno': {
    layout: 'article',
    eyebrow: 'AMBIENTE · 7 MIN',
    title: 'Come illuminare il soggiorno',
    subtitle: 'Luce generale, accenti e atmosfera per il living.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Combina tre livelli: luce generale (plafoniera o sospensione centrale), luce di atmósfera (piantane, applique) e accenti (faretti su quadri o libreria).',
          'Preferisci 2700–3000K per un ambiente accogliente. Usa dimmer dove possibile.',
          'Esplora il catalogo arredo filtrato per soggiorno per ispirazione.',
        ],
      },
      {
        kind: 'cta',
        title: 'Prodotti per il soggiorno',
        primaryLabel: 'Esplora soggiorno →',
        primaryHref: '/negozio?world=design&category=soggiorno',
        variant: 'accent',
      },
    ],
  },

  'guide-glossario': {
    layout: 'article',
    eyebrow: 'GLOSSARIO',
    title: 'Glossario tecnico',
    subtitle: 'Watt, lumen, Kelvin, CRI, IP e altri termini utili.',
    blocks: [
      {
        kind: 'features',
        items: [
          { title: 'Lumen (lm)', description: 'Quantità di luce emessa: più lumen = più luminoso.' },
          { title: 'Watt (W)', description: 'Potenza assorbita; con il LED conta di più il lumen per watt.' },
          { title: 'Kelvin (K)', description: 'Temperatura colore della luce.' },
          { title: 'CRI', description: 'Resa cromatica: quanto i colori appaiono naturali (idealmente >90).' },
          { title: 'Grado IP', description: 'Protezione da polvere e acqua (es. IP44 per bagno).' },
          { title: 'Dimmerabile', description: 'Compatibilità con regolatori di luce; verifica driver e lampada.' },
        ],
      },
    ],
  },

  'guide-scegliere-lampadina-led': {
    layout: 'article',
    eyebrow: 'GUIDA BASE · 5 MIN',
    title: 'Come scegliere la lampadina LED giusta',
    subtitle: 'Attacco, lumen, watt e temperatura colore spiegati in modo semplice.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Parti dall\'attacco (E27, GU10, G9…): deve combaciare con il portalampade. Poi scegli i lumen in base all\'ambiente (400–800 lm per una lampada da tavolo, 1500+ per soggiorno).',
          'Verifica dimmerabilità se usi un regolatore. Controlla la forma (globo, candela, MR16) per l\'estetica del portalampade.',
        ],
      },
      {
        kind: 'cta',
        title: 'Trova la lampadina giusta',
        primaryLabel: 'Scegli per attacco →',
        primaryHref: '/attacco',
        variant: 'accent',
      },
    ],
  },

  'guide-alimentatore-striscia-led': {
    layout: 'article',
    eyebrow: 'TECNICO · 6 MIN',
    title: 'Come calcolare l\'alimentatore per una striscia LED',
    subtitle: 'Watt totali, margine di sicurezza e tensione corretta.',
    blocks: [
      {
        kind: 'prose',
        paragraphs: [
          'Moltiplica i watt/metro della striscia per i metri totali. Aggiungi un margine del 20% per evitare surriscaldamento dell\'alimentatore.',
          'Usa la stessa tensione (12V o 24V) indicata sulla striscia. Per installazioni da esterno verifica grado IP.',
        ],
      },
      {
        kind: 'cta',
        title: 'Alimentatori nel negozio',
        primaryLabel: 'Alimentatori e driver →',
        primaryHref: '/negozio?world=technical&q=alimentatore',
        variant: 'accent',
      },
    ],
  },

  'guide-luce-calda-o-fredda': getLegacyEditorialGuideContent('luce-calda-o-fredda', 'IT'),
  'guide-calipso-artemide-io-vengo-dalla-luna': getLegacyEditorialGuideContent(
    'calipso-artemide-io-vengo-dalla-luna',
    'IT',
  ),
  'guide-la-natura-trend-2024': getLegacyEditorialGuideContent('la-natura-trend-2024', 'IT'),
}
