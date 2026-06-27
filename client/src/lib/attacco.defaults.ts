export type AttaccoSocketKey =
  | 'E27'
  | 'E14'
  | 'GU10'
  | 'GU5.3'
  | 'G9'
  | 'G4'
  | 'R7s'
  | 'GX53'
  | 'G13'
  | '2G11'
  | 'G24'

export type AttaccoSocket = {
  key: AttaccoSocketKey | 'altri'
  code: string
  hint: string
  description: string
  href: string
  icon: AttaccoSocketKey | 'altri'
  dashed?: boolean
}

export type AttaccoShape = {
  label: string
  code: string
  href: string
  icon: string
  dashed?: boolean
}

export type AttaccoGuideCard = {
  title: string
  body: string
}

export type AttaccoWizardSocket = {
  key: AttaccoSocketKey
  short: string
  name: string
  use: string
  check: string
  note?: string
  href: string
}

export const ATTACCO_HERO = {
  eyebrow: 'SCEGLI PER ATTACCO',
  title: 'Trova la lampadina giusta per il tuo attacco',
  subtitle:
    "Non serve conoscere il nome tecnico. Riconosci l'attacco dalla forma e arriva al prodotto compatibile in pochi click — riducendo errori e resi.",
  wizardTitle: 'Non sai quale attacco hai?',
  wizardDescription:
    "Rispondi a 3 domande sulla forma e le dimensioni: ti diciamo noi l'attacco e i prodotti compatibili.",
  wizardCta: 'Trova il tuo attacco →',
}

export const ATTACCO_SEARCH = {
  placeholder: 'Descrivi la lampadina: "vite grande", "due pin", "faretto baionetta", "lampadina lunga"…',
  ctaLabel: 'Cerca',
  hintsLabel: 'La ricerca capisce anche il linguaggio comune:',
  hints: [
    { label: '"vite grande" → E27', query: 'E27' },
    { label: '"faretto due pin" → GU5.3', query: 'GU5.3' },
    { label: '"lampadina lunga" → R7s', query: 'R7s' },
    { label: '"neon led" → G13 / T8', query: 'G13' },
  ],
}

function attaccoHref(code: string): string {
  const slug = code.toLowerCase().replace('.', '-').replace(' · t8', '').replace(' ', '')
  return `/attacco/${slug}`
}

export const ATTACCO_SOCKETS: AttaccoSocket[] = [
  {
    key: 'E27',
    code: 'E27',
    hint: 'attacco grande a vite',
    description: 'Il più comune per lampade da casa, sospensioni e plafoniere.',
    href: attaccoHref('e27'),
    icon: 'E27',
  },
  {
    key: 'E14',
    code: 'E14',
    hint: 'attacco piccolo a vite',
    description: 'Abat-jour, applique e lampadari decorativi.',
    href: attaccoHref('e14'),
    icon: 'E14',
  },
  {
    key: 'GU10',
    code: 'GU10',
    hint: 'faretto a baionetta',
    description: 'Faretti da incasso, spot e binari. 230V, due piedini larghi.',
    href: attaccoHref('gu10'),
    icon: 'GU10',
  },
  {
    key: 'GU5.3',
    code: 'GU5.3',
    hint: 'faretto 12V · MR16',
    description: 'Faretti 12V con trasformatore. Due pin sottili dritti.',
    href: attaccoHref('gu5-3'),
    icon: 'GU5.3',
  },
  {
    key: 'G9',
    code: 'G9',
    hint: 'capsula a vite ad asola',
    description: 'Applique, lampadari moderni e decorative. 230V.',
    href: attaccoHref('g9'),
    icon: 'G9',
  },
  {
    key: 'G4',
    code: 'G4',
    hint: 'mini capsula a due pin',
    description: 'Mobili, camper, nautica. Due pin sottili ravvicinati, 12V.',
    href: attaccoHref('g4'),
    icon: 'G4',
  },
  {
    key: 'R7s',
    code: 'R7s',
    hint: 'lampadina lineare',
    description: 'Piantane, proiettori e applique. Contatti ai lati (78 / 118 mm).',
    href: attaccoHref('r7s'),
    icon: 'R7s',
  },
  {
    key: 'GX53',
    code: 'GX53',
    hint: 'attacco piatto a disco',
    description: 'Sottopensili, mobili e faretti bassi. Lampadina circolare piatta.',
    href: attaccoHref('gx53'),
    icon: 'GX53',
  },
  {
    key: 'G13',
    code: 'G13 · T8',
    hint: 'tubo LED classico',
    description: 'Plafoniere, officine, neon LED. Tubo con due pin laterali.',
    href: attaccoHref('g13'),
    icon: 'G13',
  },
  {
    key: '2G11',
    code: '2G11',
    hint: 'tubo PL a 4 pin',
    description: 'Tubi PL-L compatti. Quattro contatti su un lato.',
    href: attaccoHref('2g11'),
    icon: '2G11',
  },
  {
    key: 'G24',
    code: 'G24',
    hint: 'PL-C a innesto',
    description: 'Lampade PL-C compatte per downlight e plafoniere.',
    href: attaccoHref('g24'),
    icon: 'G24',
  },
  {
    key: 'altri',
    code: 'Altri attacchi',
    hint: 'B22, BA15d, E10, GY6.35…',
    description: 'Non trovi il tuo? Vedi tutti gli attacchi o chiedi aiuto.',
    href: '/catalogo?world=technical',
    icon: 'altri',
    dashed: true,
  },
]

const ATTACCO_CHIP_CODES = ['E27', 'E14', 'GU10', 'GU5.3', 'R7s', 'G9', 'G4', 'T8', 'G13', 'GX53'] as const

export function attaccoHrefForCode(code: string): string {
  const normalized = code.trim().toUpperCase()
  const socket = ATTACCO_SOCKETS.find((item) => item.code === normalized || item.key === normalized)
  if (socket) return socket.href
  if (normalized === 'T8') return attaccoHref('t8')
  if (ATTACCO_CHIP_CODES.includes(normalized as (typeof ATTACCO_CHIP_CODES)[number])) {
    return attaccoHref(normalized.toLowerCase())
  }
  return '/attacco'
}

export const ATTACCO_SHAPES: AttaccoShape[] = [
  { label: 'Goccia', code: 'A60', href: '/catalogo?world=technical&q=A60', icon: 'goccia' },
  { label: 'Sfera', code: 'G45', href: '/catalogo?world=technical&q=G45', icon: 'sfera' },
  { label: 'Candela', code: 'C35', href: '/catalogo?world=technical&q=C35', icon: 'candela' },
  { label: 'Tubolare', code: 'T', href: '/catalogo?world=technical&q=tubolare', icon: 'tubolare' },
  { label: 'Riflettore', code: 'R63', href: '/catalogo?world=technical&q=R63', icon: 'riflettore' },
  { label: 'Globo', code: 'G95', href: '/catalogo?world=technical&q=G95', icon: 'globo' },
  { label: 'Spot', code: 'MR16', href: '/catalogo?world=technical&q=MR16', icon: 'spot' },
  { label: 'Lineare', code: 'R7s', href: attaccoHref('r7s'), icon: 'lineare' },
  { label: 'Filamento', code: 'ST64', href: '/catalogo?world=technical&q=ST64', icon: 'filamento' },
  {
    label: 'Tutte le forme',
    code: 'oliva, globo, PAR…',
    href: '/catalogo?world=technical',
    icon: 'altri',
    dashed: true,
  },
]

export const ATTACCO_GUIDE_CARDS: AttaccoGuideCard[] = [
  {
    title: 'E27 o E14?',
    body: 'Sono entrambi a vite: cambia il diametro. E27 ≈ 27 mm (lampade, plafoniere, sospensioni), E14 ≈ 14 mm (abat-jour, applique, lampadari). Misura la filettatura per non sbagliare.',
  },
  {
    title: 'GU10 o GU5.3?',
    body: 'GU10 ha due piedini larghi con testa e si ruota per fissarsi (230V, no trasformatore). GU5.3 ha due pin sottili dritti e si infila (12V, con trasformatore). Non sono intercambiabili.',
  },
  {
    title: 'G9 o G4?',
    body: 'G9 ha due contatti ad asola ed è a 230V (applique, lampadari). G4 ha due pin sottili ravvicinati ed è a 12V (mobili, faretti piccoli). L\'alimentazione è diversa: attenzione.',
  },
]

export const ATTACCO_CONSULT_CTA = {
  title: "Ancora un dubbio sull'attacco?",
  description:
    "Inviaci una foto della lampadina o dell'attacco da vicino: ti diciamo qual è e ti mostriamo i prodotti compatibili. Niente più acquisti sbagliati.",
  primaryCta: { label: 'Invia una foto', href: '/prodotto-non-trovato' },
  secondaryCta: { label: 'Apri il wizard attacchi', href: '#wizard' },
}

export const ATTACCO_WIZARD_SOCKETS: Record<AttaccoSocketKey, AttaccoWizardSocket> = {
  E27: {
    key: 'E27',
    short: 'E27',
    name: 'Attacco grande a vite',
    use: 'Lampade da tavolo, plafoniere, sospensioni.',
    check: 'Filettatura a vite larga, diametro circa 27 mm.',
    href: attaccoHref('e27'),
  },
  E14: {
    key: 'E14',
    short: 'E14',
    name: 'Attacco piccolo a vite',
    use: 'Abat-jour, applique, lampadari decorativi.',
    check: 'Filettatura a vite stretta, diametro circa 14 mm.',
    note: 'Spesso confuso con E27: misura il diametro della vite.',
    href: attaccoHref('e14'),
  },
  GU10: {
    key: 'GU10',
    short: 'GU10',
    name: 'Faretto a baionetta',
    use: 'Faretti da incasso, spot orientabili, binari.',
    check: 'Due piedini larghi con testa: si inserisce e si ruota.',
    note: 'Non compatibile con GU5.3 / MR16. Funziona a 230V, senza trasformatore.',
    href: attaccoHref('gu10'),
  },
  'GU5.3': {
    key: 'GU5.3',
    short: 'GU5.3 / MR16',
    name: 'Faretto con due pin sottili',
    use: 'Faretti a 12V con trasformatore.',
    check: 'Due pin sottili e dritti: si infila senza ruotare.',
    note: 'Non compatibile con GU10. Richiede un trasformatore 12V.',
    href: attaccoHref('gu5-3'),
  },
  G9: {
    key: 'G9',
    short: 'G9',
    name: 'Capsula a contatti ad asola',
    use: 'Applique, lampadari moderni, lampade decorative.',
    check: 'Due contatti a forma di asola, ravvicinati. 230V.',
    note: 'Diverso dal G4: il G9 va a 230V.',
    href: attaccoHref('g9'),
  },
  G4: {
    key: 'G4',
    short: 'G4',
    name: 'Mini capsula a due pin',
    use: 'Mobili, camper, nautica, piccole lampade.',
    check: 'Due pin sottili molto vicini tra loro. 12V.',
    note: 'Diverso dal G9: il G4 va a 12V, con trasformatore.',
    href: attaccoHref('g4'),
  },
  R7s: {
    key: 'R7s',
    short: 'R7s',
    name: 'Lampadina lineare',
    use: 'Piantane, proiettori, applique lineari.',
    check: 'Tubo con contatti a molla ai due lati. Misura la lunghezza (78 o 118 mm).',
    note: 'Controlla bene la lunghezza: è il dato che cambia più spesso.',
    href: attaccoHref('r7s'),
  },
  G13: {
    key: 'G13',
    short: 'G13 · T8',
    name: 'Tubo LED classico',
    use: 'Plafoniere, officine, neon LED.',
    check: 'Tubo lungo con due pin laterali a una estremità.',
    note: 'Per i LED retrofit verifica se serve bypassare il reattore/starter.',
    href: attaccoHref('g13'),
  },
  GX53: {
    key: 'GX53',
    short: 'GX53',
    name: 'Attacco piatto a disco',
    use: 'Sottopensili, mobili e faretti bassi.',
    check: 'Lampadina circolare piatta con attacco a disco.',
    href: attaccoHref('gx53'),
  },
  '2G11': {
    key: '2G11',
    short: '2G11',
    name: 'Tubo PL a 4 pin',
    use: 'Tubi PL-L compatti.',
    check: 'Quattro contatti su un lato del tubo.',
    href: attaccoHref('2g11'),
  },
  G24: {
    key: 'G24',
    short: 'G24',
    name: 'PL-C a innesto',
    use: 'Lampade PL-C compatte per downlight e plafoniere.',
    check: 'Innesto a due contatti con base compatta.',
    href: attaccoHref('g24'),
  },
}

export function socketCodeFromHref(href: string): string | null {
  const match = href.match(/\/attacco\/([^/?]+)/i)
  if (!match) return null
  const slug = match[1].toLowerCase()
  const aliases: Record<string, string> = {
    e27: 'E27',
    e14: 'E14',
    gu10: 'GU10',
    'gu5-3': 'GU5.3',
    gu53: 'GU5.3',
    g9: 'G9',
    g4: 'G4',
    r7s: 'R7s',
    gx53: 'GX53',
    g13: 'G13',
    t8: 'G13',
    '2g11': '2G11',
    g24: 'G24',
  }
  return aliases[slug] ?? null
}
