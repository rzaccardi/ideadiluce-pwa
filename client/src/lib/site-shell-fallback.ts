import type { SiteShellContent } from '@/types/site-content'
import { enrichNavColumns } from '@/lib/mobile-nav-visuals'
import { COMPANY_CONTACT } from '@/lib/company-contact'

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

/** Shell di fallback: header/footer sempre pronti mentre il CMS carica. */
export const FALLBACK_SITE_SHELL: SiteShellContent = {
  utilityBar: {
    messages: ['Spedizioni tracciate in tutto il mondo', 'Assistenza tecnica reale'],
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
        href: '/categoria-prodotto/illuminazione-arredo',
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
                { label: 'OSRAM', href: '/brand/osram' },
                { label: 'TLB', href: '/brand/tlb' },
                { label: 'PHILIPS', href: '/brand/philips' },
                { label: 'GENERAL ELECTRIC', href: '/brand/general-electric' },
                { label: 'SYLVANIA', href: '/brand/sylvania' },
                { label: 'LEDVANCE', href: '/brand/ledvance' },
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
        label: 'Tecnico',
        href: '/categoria-prodotto/illuminazione-tecnica',
        panel: {
          columns: enrichNavColumns([
            {
              title: 'TECNOLOGIA',
              links: [
                { label: 'LED', href: '/categoria-tecnica/led' },
                { label: 'Alogena', href: '/categoria-tecnica/alogene' },
                { label: 'Fluorescenza', href: '/categoria-tecnica/fluorescente' },
                { label: 'Incandescenza', href: '/categoria-tecnica/incandescenza' },
                { label: 'Scarica', href: '/categoria-tecnica/scarica' },
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
                { label: 'Driver', href: '/categoria-tecnica/driver' },
                { label: 'Ballast', href: '/categoria-tecnica/ballast' },
                { label: 'Portalampade', href: '/negozio?world=technical&tag=portalampade' },
                { label: 'Accenditori', href: '/categoria-tecnica/accenditori' },
                { label: 'Accessori', href: '/categoria-tecnica/accessori' },
              ],
            },
            {
              title: 'APPLICAZIONI',
              links: [
                { label: 'Strisce LED', href: '/categoria-tecnica/strip' },
                { label: 'Industriale', href: '/categoria-tecnica/industriale' },
                { label: 'Automotive', href: '/categoria-tecnica/automotive' },
                { label: 'Photo optic', href: '/categoria-tecnica/photo' },
                { label: 'Display optic', href: '/categoria-tecnica/display' },
              ],
            },
            {
              title: 'GUIDE TECNICHE',
              links: [
                { label: 'Kelvin & CRI', href: '/guide/luce-calda-naturale-fredda' },
                { label: 'Lumen vs watt', href: '/guide/scegliere-lampadina-led' },
                { label: 'Dimmerabilità', href: '/guide/scegliere-lampadina-led' },
                { label: 'Grado IP', href: '/guide/glossario' },
                { label: 'Retrofit LED', href: '/guide/scegliere-lampadina-led' },
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
      { kind: 'link', id: 'ambienti', label: 'Ambienti', href: '/ambienti' },
      { kind: 'link', id: 'brand', label: 'Brand', href: '/brand' },
      { kind: 'link', id: 'guide', label: 'Guide', href: '/guide' },
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
    social: [
      { label: 'Instagram', href: '' },
      { label: 'Facebook', href: '' },
      { label: 'LinkedIn', href: '' },
      { label: 'Pinterest', href: '' },
    ],
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
