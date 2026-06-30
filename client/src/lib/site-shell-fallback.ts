import type { SiteShellContent } from '@/types/site-content'
import { enrichNavColumns } from '@/lib/mobile-nav-visuals'
import { COMPANY_CONTACT, SHOWROOM_MAPS_URL } from '@/lib/company-contact'

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
    messages: ['Spedizione tracciata in tutta Italia', 'Showroom a Roma', 'Assistenza tecnica reale'],
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
                { label: 'Sospensione', href: '/negozio?world=design&q=sospensione' },
                { label: 'Parete', href: '/negozio?world=design&q=parete' },
                { label: 'Tavolo', href: '/negozio?world=design&q=tavolo' },
                { label: 'Terra', href: '/negozio?world=design&q=terra' },
                { label: 'Plafoniere', href: '/negozio?world=design&q=plafoniere' },
                { label: 'Faretti e incassi', href: '/negozio?world=design&q=faretto' },
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
                { label: 'Moderno', href: '/negozio?world=design&q=moderno' },
                { label: 'Classico', href: '/negozio?world=design&q=classico' },
                { label: 'Minimal', href: '/negozio?world=design&q=minimal' },
                { label: 'Decorativo', href: '/negozio?world=design&q=decorativo' },
                { label: 'Industrial', href: '/negozio?world=design&q=industrial' },
                { label: 'Outdoor', href: '/negozio?world=design&q=outdoor' },
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
            {
              title: 'IN EVIDENZA',
              links: [
                { label: 'Novità', href: '/negozio?world=design&sort=new' },
                { label: 'Pronta consegna', href: '/negozio?world=design&inStock=1' },
                { label: 'Icone di design', href: '/negozio?world=design&q=design' },
                { label: 'Offerte', href: '/negozio?world=design&q=offerta' },
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
                { label: 'LED', href: '/negozio?world=technical&q=LED' },
                { label: 'Alogena', href: '/negozio?world=technical&q=alogena' },
                { label: 'Fluorescenza', href: '/negozio?world=technical&q=fluorescenza' },
                { label: 'Incandescenza', href: '/negozio?world=technical&q=incandescenza' },
                { label: 'Scarica', href: '/negozio?world=technical&q=scarica' },
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
                { label: 'Driver LED', href: '/negozio?world=technical&q=driver' },
                { label: 'Trasformatori', href: '/negozio?world=technical&q=trasformatore' },
                { label: 'Portalampade', href: '/negozio?world=technical&q=portalampade' },
                { label: 'Dimmer', href: '/negozio?world=technical&q=dimmer' },
              ],
            },
            {
              title: 'APPLICAZIONI',
              links: [
                { label: 'Strisce LED', href: '/negozio?world=technical&q=striscia+led' },
                { label: 'Profili LED', href: '/negozio?world=technical&q=profilo+led' },
                { label: 'Automotive', href: '/negozio?world=technical&q=automotive' },
                { label: 'Proiettori', href: '/negozio?world=technical&q=proiettore' },
                { label: 'Outdoor IP65', href: '/negozio?world=technical&q=IP65' },
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
    { title: 'Showroom Roma', subtitle: 'Vieni a trovarci dal vivo' },
    { title: 'Ricambi difficili', subtitle: 'Foto, EAN o codice prodotto' },
    { title: 'Spedizione tracciata', subtitle: 'In tutta Italia' },
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
          { label: 'Showroom Roma', href: SHOWROOM_MAPS_URL },
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
