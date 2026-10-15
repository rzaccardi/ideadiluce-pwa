import type { SiteShellContent } from '@/types/site-content'
import { enrichNavColumns } from '@/lib/mobile-nav-visuals'
import { COMPANY_CONTACT, COMPANY_FACEBOOK_URL } from '@/lib/company-contact'

const SOCKET_ITEMS = [
  { code: 'E27', hint: 'a vite grande', href: '/attacco/e27' },
  { code: 'E14', hint: 'a vite piccola', href: '/attacco/e14' },
  { code: 'GU10', hint: '230V bispina', href: '/attacco/gu10' },
  { code: 'GU5.3', hint: '12V MR16', href: '/attacco/gu5-3' },
  { code: 'R7s', hint: 'lineare', href: '/attacco/r7s' },
  { code: 'G9', hint: 'bispina 230V', href: '/attacco/g9' },
  { code: 'G4', hint: '12V capsula', href: '/attacco/g4' },
  { code: 'T8', hint: 'tubo G13', href: '/attacco/t8' },
] as const

function attaccoMegaMenuColumns() {
  const toLink = (s: (typeof SOCKET_ITEMS)[number]) => ({
    label: `${s.code} - ${s.hint}`,
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

/** Shell di fallback: header/footer sempre pronti mentre il CMS carica. */
export const FALLBACK_SITE_SHELL: SiteShellContent = {
  utilityBar: {
    messages: [
      'Spedizioni tracciate in tutto il mondo',
      'Assistenza tecnica reale',
      'Catalogo per professionisti',
    ],
    links: [
      { label: 'Professionisti', href: '/professionisti' },
      { label: 'Aiuto', href: '/prodotto-non-trovato' },
    ],
  },
  nav: {
    items: [
      {
        kind: 'dropdown',
        id: 'arredo',
        label: 'Arredo',
        href: '/illuminazione-arredo',
        panel: {
          columns: enrichNavColumns([
            {
              title: 'PER TIPOLOGIA',
              links: [
                { label: 'Sospensione', href: '/tipologia/sospensione' },
                { label: 'Parete', href: '/tipologia/parete' },
                { label: 'Tavolo', href: '/tipologia/tavolo' },
                { label: 'Terra', href: '/tipologia/terra' },
                { label: 'Plafoniere', href: '/tipologia/plafoniere' },
                { label: 'Faretti e incassi', href: '/tipologia/incasso' },
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
                { label: 'Moderno', href: '/stile/moderno' },
                { label: 'Classico', href: '/stile/classico' },
                { label: 'Minimal', href: '/stile/minimal' },
                { label: 'Decorativo', href: '/stile/decorativo' },
                { label: 'Industrial', href: '/stile/industrial' },
                { label: 'Outdoor', href: '/stile/outdoor' },
              ],
            },
            {
              title: 'BRAND',
              links: [
                { label: 'Artemide', href: '/brand/artemide' },
                { label: 'Flos', href: '/brand/flos' },
                { label: 'FontanaArte', href: '/brand/fontanaarte' },
                { label: 'Eglo', href: '/brand/eglo' },
                { label: 'Ideal Lux', href: '/brand/ideal-lux' },
                { label: 'TLB', href: '/brand/tlb' },
              ],
            },
            {
              title: 'IN EVIDENZA',
              links: [
                { label: 'Novità', href: '/negozio?world=design&sort=new' },
                { label: 'Pronta consegna', href: '/negozio?world=design&inStock=1' },
                { label: 'Icone di design', href: '/stile/design' },
                { label: 'Offerte', href: '/negozio?world=design&tag=offerta' },
              ],
            },
          ]),
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
        label: 'Tecnica',
        href: '/categoria-prodotto/illuminazione-tecnica',
        panel: {
          columns: enrichNavColumns([
            {
              title: 'TECNOLOGIA',
              links: [
                { label: 'LED', href: '/categoria-tecnica/led', filterKind: 'category', filterValue: 'led', filterWorld: 'technical' },
                { label: 'Alogena', href: '/categoria-tecnica/alogene', filterKind: 'category', filterValue: 'alogene', filterWorld: 'technical' },
                { label: 'Fluorescenza', href: '/categoria-tecnica/fluorescente', filterKind: 'category', filterValue: 'fluorescente', filterWorld: 'technical' },
                { label: 'Incandescenza', href: '/categoria-tecnica/incandescenza', filterKind: 'category', filterValue: 'incandescenza', filterWorld: 'technical' },
                { label: 'Scarica', href: '/categoria-tecnica/scarica', filterKind: 'category', filterValue: 'scarica', filterWorld: 'technical' },
              ],
            },
            {
              title: 'PER ATTACCO',
              links: [
                { label: 'E27 · E14', href: '/attacco/e27', filterKind: 'attacco', filterValue: 'e27', filterWorld: 'technical' },
                { label: 'GU10 · GU5.3', href: '/attacco/gu10', filterKind: 'attacco', filterValue: 'gu10', filterWorld: 'technical' },
                { label: 'R7s · G9 · G4', href: '/attacco/r7s', filterKind: 'attacco', filterValue: 'r7s', filterWorld: 'technical' },
                { label: 'G13 / T8', href: '/attacco/g13', filterKind: 'attacco', filterValue: 'g13', filterWorld: 'technical' },
                { label: 'AR111 · GX53', href: '/attacco/gx53', filterKind: 'attacco', filterValue: 'gx53', filterWorld: 'technical' },
              ],
            },
            {
              title: 'PRODOTTI TECNICI',
              links: [
                { label: 'Driver', href: '/categoria-tecnica/driver', filterKind: 'category', filterValue: 'driver', filterWorld: 'technical' },
                { label: 'Ballast', href: '/categoria-tecnica/ballast', filterKind: 'category', filterValue: 'ballast', filterWorld: 'technical' },
                { label: 'Portalampade', href: '/negozio?world=technical&tag=portalampade', filterKind: 'tag', filterValue: 'portalampade', filterWorld: 'technical' },
                { label: 'Accenditori', href: '/negozio?world=technical&tag=starter', filterKind: 'tag', filterValue: 'starter', filterWorld: 'technical' },
                { label: 'Accessori', href: '/categoria-tecnica/accessori', filterKind: 'category', filterValue: 'accessori', filterWorld: 'technical' },
              ],
            },
            {
              title: 'APPLICAZIONI',
              links: [
                { label: 'Automotive', href: '/negozio?world=technical&tag=automoto', filterKind: 'tag', filterValue: 'automoto', filterWorld: 'technical' },
                { label: 'Ottiche', href: '/negozio?world=technical&tag=optic', filterKind: 'tag', filterValue: 'optic', filterWorld: 'technical' },
                { label: 'Dicroiche', href: '/negozio?world=technical&tag=dicro', filterKind: 'tag', filterValue: 'dicro', filterWorld: 'technical' },
                { label: 'Circolina', href: '/negozio?world=technical&tag=circolina', filterKind: 'tag', filterValue: 'circolina', filterWorld: 'technical' },
                { label: 'Lineari', href: '/negozio?world=technical&tag=lineare', filterKind: 'tag', filterValue: 'lineare', filterWorld: 'technical' },
              ],
            },
            {
              title: 'GUIDE TECNICHE',
              links: [
                { label: 'Kelvin & CRI', href: '/guide/luce-calda-naturale-fredda' },
                { label: 'Lumen vs watt', href: '/guide/scegliere-lampadina-led' },
                { label: 'Dimmerabilità', href: '/guide/dimmerabilita' },
                { label: 'Grado IP', href: '/guide/grado-ip' },
                { label: 'Retrofit LED', href: '/guide/retrofit-led' },
              ],
            },
          ]),
          promo: {
            title: 'Prodotto non trovato?',
            description: "Invia foto, EAN o codice: troviamo il ricambio o un'alternativa.",
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
          eyebrow: 'Lampadine per attacco · ordinati per diffusione',
          allSocketsCta: 'Tutti gli attacchi →',
          promo: {
            title: "Non trovi l'attacco?",
            description: 'Invia una foto o il codice prodotto: ti aiutiamo a trovare il ricambio.',
            ctaLabel: 'Richiedi supporto →',
            ctaHref: '/prodotto-non-trovato',
            variant: 'technical',
          },
        },
      },
      { kind: 'link', id: 'ambienti', label: 'Ambienti', href: '/acquista-ambiente' },
      { kind: 'link', id: 'brand', label: 'Brand', href: '/brand' },
      { kind: 'link', id: 'guide', label: 'Guide', href: '/blog' },
    ],
  },
  trustBar: [
    { title: 'Assistenza reale', subtitle: 'Ti aiutiamo a scegliere' },
    { title: 'Ricambi difficili', subtitle: 'Foto, EAN o codice prodotto' },
    { title: 'Spedizioni tracciate', subtitle: 'In tutto il mondo' },
  ],
  footer: {
    company: {
      company: COMPANY_CONTACT.company,
      vat: COMPANY_CONTACT.vat,
      rea: COMPANY_CONTACT.rea,
      addressLines: [...COMPANY_CONTACT.addressLines],
      phone: COMPANY_CONTACT.phone,
      phoneHref: COMPANY_CONTACT.phoneHref,
      email: COMPANY_CONTACT.email,
      hoursLines: [...COMPANY_CONTACT.hoursLines],
    },
    social: [{ label: 'Facebook', href: COMPANY_FACEBOOK_URL }],
    columns: [
      {
        title: 'Idea di Luce',
        links: [
          { label: 'Chi siamo', href: '/chi-siamo' },
          { label: 'Professionisti', href: '/professionisti' },
          { label: 'Lavora con noi', href: '/lavora-con-noi' },
        ],
      },
      {
        title: 'Servizio clienti',
        links: [
          { label: "Termini d'Uso e Condizioni di Vendita", href: '/tos' },
          { label: 'Privacy Policy', href: '/privacy-policy' },
        ],
      },
    ],
    notFoundCta: {
      title: 'Non trovi il prodotto?',
      description: "Invia una foto dell'attacco o il codice: ti aiutiamo noi.",
      ctaLabel: 'Richiedi supporto →',
      ctaHref: '/on-demand',
    },
    legalNote: '© TLB ITALY Srl · P.IVA IT17245551001',
  },
}
