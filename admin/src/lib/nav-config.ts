import type { LucideIcon } from 'lucide-react'
import {
  BarChart3Icon,
  BellRingIcon,
  BookOpenIcon,
  BriefcaseBusinessIcon,
  FileTextIcon,
  HomeIcon,
  LayoutTemplateIcon,
  MailIcon,
  MegaphoneIcon,
  SearchIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TagsIcon,
  TruckIcon,
  ReceiptIcon,
  RefreshCwIcon,
} from 'lucide-react'
import { getSitePageLabel } from '@/features/site'

function getSitePageLabelFromPath(pageKey: string) {
  return getSitePageLabel(pageKey)
}

/** Etichetta leggibile da slug guida (es. luce-calda-o-fredda → Luce calda o fredda). */
function formatGuideSlugLabel(slug: string) {
  const raw = slug.trim()
  if (!raw) return 'Dettaglio guida'
  return raw
    .split('-')
    .filter(Boolean)
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  accentClass: string
  accentBgClass: string
  match?: (pathname: string) => boolean
}

export type NavSection = {
  label: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    label: 'Vendite',
    items: [
      {
        to: '/orders',
        label: 'Ordini',
        icon: ShoppingCartIcon,
        accentClass: 'text-indigo-600',
        accentBgClass: 'bg-indigo-50',
        match: (p) => p.startsWith('/orders'),
      },
      {
        to: '/abandoned-carts',
        label: 'Carrelli abbandonati',
        icon: ShoppingBagIcon,
        accentClass: 'text-orange-600',
        accentBgClass: 'bg-orange-50',
        match: (p) => p.startsWith('/abandoned-carts'),
      },
      {
        to: '/restock',
        label: 'Restock',
        icon: BellRingIcon,
        accentClass: 'text-amber-600',
        accentBgClass: 'bg-amber-50',
        match: (p) => p.startsWith('/restock'),
      },
      {
        to: '/odoo/quotations',
        label: 'Preventivi Odoo',
        icon: FileTextIcon,
        accentClass: 'text-cyan-600',
        accentBgClass: 'bg-cyan-50',
        match: (p) => p.startsWith('/odoo/quotations'),
      },
    ],
  },
  {
    label: 'Catalogo',
    items: [
      {
        to: '/odoo/pricelists',
        label: 'Listini Odoo',
        icon: TagsIcon,
        accentClass: 'text-pink-600',
        accentBgClass: 'bg-pink-50',
        match: (p) => p.startsWith('/odoo/pricelists'),
      },
      {
        to: '/catalog-cache',
        label: 'Cache catalogo',
        icon: RefreshCwIcon,
        accentClass: 'text-blue-600',
        accentBgClass: 'bg-blue-50',
        match: (p) => p.startsWith('/catalog-cache'),
      },
      {
        to: '/search-analytics',
        label: 'Analytics ricerca',
        icon: BarChart3Icon,
        accentClass: 'text-violet-600',
        accentBgClass: 'bg-violet-50',
        match: (p) => p.startsWith('/search-analytics'),
      },
      {
        to: '/social-proof',
        label: 'Social proof',
        icon: MegaphoneIcon,
        accentClass: 'text-emerald-600',
        accentBgClass: 'bg-emerald-50',
        match: (p) => p.startsWith('/social-proof'),
      },
    ],
  },
  {
    label: 'Contenuti',
    items: [
      {
        to: '/site',
        label: 'Pagine sito',
        icon: LayoutTemplateIcon,
        accentClass: 'text-sky-600',
        accentBgClass: 'bg-sky-50',
        match: (p) => p.startsWith('/site'),
      },
      {
        to: '/guides',
        label: 'Guide',
        icon: BookOpenIcon,
        accentClass: 'text-amber-700',
        accentBgClass: 'bg-amber-50',
        match: (p) => p.startsWith('/guides'),
      },
      {
        to: '/seo',
        label: 'SEO e feed',
        icon: SearchIcon,
        accentClass: 'text-emerald-700',
        accentBgClass: 'bg-emerald-50',
        match: (p) => p.startsWith('/seo'),
      },
    ],
  },
  {
    label: 'Clienti',
    items: [
      {
        to: '/site-inquiries',
        label: 'Richieste contatto',
        icon: MailIcon,
        accentClass: 'text-sky-600',
        accentBgClass: 'bg-sky-50',
        match: (p) => p.startsWith('/site-inquiries'),
      },
      {
        to: '/professional-requests',
        label: 'Professionisti',
        icon: BriefcaseBusinessIcon,
        accentClass: 'text-violet-600',
        accentBgClass: 'bg-violet-50',
        match: (p) => p.startsWith('/professional-requests'),
      },
    ],
  },
  {
    label: 'Configurazione',
    items: [
      {
        to: '/shipping',
        label: 'Spedizioni',
        icon: TruckIcon,
        accentClass: 'text-red-600',
        accentBgClass: 'bg-red-50',
        match: (p) => p.startsWith('/shipping'),
      },
      {
        to: '/tax-rules',
        label: 'Fiscalità',
        icon: ReceiptIcon,
        accentClass: 'text-teal-600',
        accentBgClass: 'bg-teal-50',
        match: (p) => p.startsWith('/tax-rules'),
      },
    ],
  },
]

export type BreadcrumbItem = { label: string; href?: string }

export function getBreadcrumbs(pathname: string, _search = ''): BreadcrumbItem[] {
  if (pathname.startsWith('/orders/') && pathname !== '/orders') {
    return [
      { label: 'Ordini', href: '/orders' },
      { label: 'Dettaglio ordine' },
    ]
  }
  if (pathname.startsWith('/orders')) {
    return [
      { label: 'Ordini', href: '/orders' },
      { label: 'Ordini e-commerce' },
    ]
  }
  if (pathname.startsWith('/abandoned-carts/') && pathname !== '/abandoned-carts') {
    return [
      { label: 'Carrelli abbandonati', href: '/abandoned-carts' },
      { label: 'Dettaglio carrello' },
    ]
  }
  if (pathname.startsWith('/abandoned-carts')) {
    return [
      { label: 'Carrelli abbandonati', href: '/abandoned-carts' },
      { label: 'Abbandoni checkout e riserve scadute' },
    ]
  }
  if (pathname.startsWith('/restock/') && pathname !== '/restock') {
    return [
      { label: 'Restock', href: '/restock' },
      { label: 'Dettaglio richiesta' },
    ]
  }
  if (pathname.startsWith('/restock')) {
    return [
      { label: 'Restock', href: '/restock' },
      { label: 'Richieste «Avvisami al restock» dalla PWA' },
    ]
  }
  if (pathname.startsWith('/shipping')) {
    return [
      { label: 'Spedizioni', href: '/shipping' },
      { label: 'Zone, corrieri DHL/FedEx e simulatore' },
    ]
  }
  if (pathname.startsWith('/tax-rules')) {
    return [
      { label: 'Fiscalità', href: '/tax-rules' },
      { label: 'Regole IVA e posizioni fiscali' },
    ]
  }
  if (pathname.startsWith('/social-proof')) {
    return [
      { label: 'Social proof', href: '/social-proof' },
      { label: 'Attività acquisti su scheda prodotto, import Odoo e soglie' },
    ]
  }
  if (pathname.startsWith('/professional-requests/') && pathname !== '/professional-requests') {
    return [
      { label: 'Professionisti', href: '/professional-requests' },
      { label: 'Dettaglio richiesta' },
    ]
  }
  if (pathname.startsWith('/professional-requests')) {
    return [
      { label: 'Professionisti', href: '/professional-requests' },
      { label: 'Richieste attivazione B2B dalla PWA' },
    ]
  }
  if (pathname.startsWith('/site-inquiries/') && pathname !== '/site-inquiries') {
    return [
      { label: 'Richieste contatto', href: '/site-inquiries' },
      { label: 'Dettaglio richiesta' },
    ]
  }
  if (pathname.startsWith('/site-inquiries')) {
    return [
      { label: 'Richieste contatto', href: '/site-inquiries' },
      { label: 'Moduli Contatti e lead dal sito' },
    ]
  }
  if (pathname.startsWith('/guides/') && pathname !== '/guides') {
    const slug = decodeURIComponent(pathname.slice('/guides/'.length).split('/')[0] ?? '')
    return [
      { label: 'Guide', href: '/guides' },
      { label: formatGuideSlugLabel(slug) },
    ]
  }
  if (pathname.startsWith('/guides')) {
    return [
      { label: 'Guide', href: '/guides' },
      { label: 'Elenco guide' },
    ]
  }
  if (pathname.startsWith('/seo')) {
    return [
      { label: 'SEO e feed', href: '/seo' },
      { label: 'Sitemap, Merchant Center e redirect' },
    ]
  }
  if (pathname.startsWith('/site/') && pathname !== '/site') {
    const pageKey = decodeURIComponent(pathname.slice('/site/'.length).split('/')[0] ?? '')
    return [
      { label: 'Pagine sito', href: '/site' },
      { label: getSitePageLabelFromPath(pageKey) },
    ]
  }
  if (pathname.startsWith('/site')) {
    return [
      { label: 'Pagine sito', href: '/site' },
      { label: 'Pagine editoriali PWA' },
    ]
  }
  if (pathname.startsWith('/odoo/quotations/') && pathname !== '/odoo/quotations') {
    return [
      { label: 'Preventivi Odoo', href: '/odoo/quotations' },
      { label: 'Dettaglio preventivo' },
    ]
  }
  if (pathname.startsWith('/odoo/quotations')) {
    return [
      { label: 'Preventivi Odoo', href: '/odoo/quotations' },
      { label: 'Preventivi draft/sent da sale.order' },
    ]
  }
  if (pathname.startsWith('/odoo/pricelists')) {
    return [
      { label: 'Listini Odoo', href: '/odoo/pricelists' },
      { label: 'Elenco listini product.pricelist' },
    ]
  }
  if (pathname.startsWith('/search-analytics')) {
    return [
      { label: 'Analytics ricerca', href: '/search-analytics' },
      { label: 'Query catalogo e trend di mercato' },
    ]
  }
  if (pathname.startsWith('/catalog-cache')) {
    return [
      { label: 'Cache catalogo', href: '/catalog-cache' },
      { label: 'Indice OdooCatalog e sync notturno' },
    ]
  }
  return []
}

export function getPageMeta(pathname: string, _search = ''): {
  title: string
  description?: string
  icon?: LucideIcon
  iconClassName?: string
  iconBgClassName?: string
} {
  if (pathname.startsWith('/abandoned-carts/') && pathname !== '/abandoned-carts') {
    return {
      title: 'Dettaglio carrello',
      description: 'Righe e contatto al momento dell’abbandono',
      icon: ShoppingBagIcon,
      iconClassName: 'text-orange-600',
      iconBgClassName: 'bg-orange-50',
    }
  }
  if (pathname.startsWith('/abandoned-carts')) {
    return {
      title: 'Carrelli abbandonati',
      description: 'Checkout abbandonati, timeout pagamento e riserve scadute',
      icon: ShoppingBagIcon,
      iconClassName: 'text-orange-600',
      iconBgClassName: 'bg-orange-50',
    }
  }
  if (pathname.startsWith('/restock/') && pathname !== '/restock') {
    return {
      title: 'Dettaglio richiesta restock',
      description: 'Prodotto, contatto e stato notifica',
      icon: BellRingIcon,
      iconClassName: 'text-amber-600',
      iconBgClassName: 'bg-amber-50',
    }
  }
  if (pathname.startsWith('/restock')) {
    return {
      title: 'Richieste restock',
      description: 'Avvisi inviati dalla scheda prodotto quando l’articolo è esaurito',
      icon: BellRingIcon,
      iconClassName: 'text-amber-600',
      iconBgClassName: 'bg-amber-50',
    }
  }
  if (pathname.startsWith('/orders/') && pathname !== '/orders') {
    return {
      title: 'Dettaglio ordine',
      description: 'Journey, mapping e insight UX',
      icon: ShoppingCartIcon,
      iconClassName: 'text-indigo-600',
      iconBgClassName: 'bg-indigo-50',
    }
  }
  if (pathname.startsWith('/orders')) {
    return {
      title: 'Ordini',
      description: 'Ordini e-commerce PWA con filtri e journey checkout',
      icon: ShoppingCartIcon,
      iconClassName: 'text-indigo-600',
      iconBgClassName: 'bg-indigo-50',
    }
  }
  if (pathname.startsWith('/shipping')) {
    return {
      title: 'Spedizioni',
      description: 'Zone, corrieri DHL/FedEx e simulatore',
      icon: TruckIcon,
      iconClassName: 'text-red-600',
      iconBgClassName: 'bg-red-50',
    }
  }
  if (pathname.startsWith('/tax-rules')) {
    return {
      title: 'Fiscalità',
      description: 'Regole IVA per paese, segmento cliente e validazione P.IVA',
      icon: ReceiptIcon,
      iconClassName: 'text-teal-600',
      iconBgClassName: 'bg-teal-50',
    }
  }
  if (pathname.startsWith('/social-proof')) {
    return {
      title: 'Social proof',
      description: 'Attività acquisti su scheda prodotto, import Odoo e soglie',
      icon: MegaphoneIcon,
      iconClassName: 'text-emerald-600',
      iconBgClassName: 'bg-emerald-50',
    }
  }
  if (pathname.startsWith('/professional-requests/') && pathname !== '/professional-requests') {
    return {
      title: 'Dettaglio richiesta professionista',
      description: 'Dati azienda, P.IVA e gestione stato',
      icon: BriefcaseBusinessIcon,
      iconClassName: 'text-violet-600',
      iconBgClassName: 'bg-violet-50',
    }
  }
  if (pathname.startsWith('/professional-requests')) {
    return {
      title: 'Professionisti',
      description: 'Richieste attivazione B2B inviate dalla pagina /professionisti',
      icon: BriefcaseBusinessIcon,
      iconClassName: 'text-violet-600',
      iconBgClassName: 'bg-violet-50',
    }
  }
  if (pathname.startsWith('/site-inquiries/') && pathname !== '/site-inquiries') {
    return {
      title: 'Dettaglio richiesta contatto',
      description: 'Messaggio, allegati e gestione stato',
      icon: MailIcon,
      iconClassName: 'text-sky-600',
      iconBgClassName: 'bg-sky-50',
    }
  }
  if (pathname.startsWith('/site-inquiries')) {
    return {
      title: 'Richieste contatto',
      description: 'Moduli Contatti, prodotto non trovato e lead business dal sito',
      icon: MailIcon,
      iconClassName: 'text-sky-600',
      iconBgClassName: 'bg-sky-50',
    }
  }
  if (pathname.startsWith('/guides/') && pathname !== '/guides') {
    const slug = decodeURIComponent(pathname.slice('/guides/'.length).split('/')[0] ?? '')
    return {
      title: formatGuideSlugLabel(slug),
      description: 'Contenuto, traduzioni e indicizzazione della guida',
      icon: BookOpenIcon,
      iconClassName: 'text-amber-700',
      iconBgClassName: 'bg-amber-50',
    }
  }
  if (pathname.startsWith('/guides')) {
    return {
      title: 'Guide',
      description: 'Pubblicazione, traduzioni e ordine nel catalogo guide',
      icon: BookOpenIcon,
      iconClassName: 'text-amber-700',
      iconBgClassName: 'bg-amber-50',
    }
  }
  if (pathname.startsWith('/seo')) {
    return {
      title: 'SEO e feed',
      description: 'Sitemap, Google Merchant feed, llms.txt e redirect 301',
      icon: SearchIcon,
      iconClassName: 'text-emerald-700',
      iconBgClassName: 'bg-emerald-50',
    }
  }
  if (pathname.startsWith('/site/') && pathname !== '/site') {
    const pageKey = decodeURIComponent(pathname.slice('/site/'.length).split('/')[0] ?? '')
    return {
      title: getSitePageLabelFromPath(pageKey),
      description: 'Testi editoriali in IT, EN, ES, FR e DE',
      icon: LayoutTemplateIcon,
      iconClassName: 'text-sky-600',
      iconBgClassName: 'bg-sky-50',
    }
  }
  if (pathname.startsWith('/site')) {
    return {
      title: 'Pagine sito',
      description: 'Header, footer, trust bar e homepage — testi gestiti dal backoffice',
      icon: LayoutTemplateIcon,
      iconClassName: 'text-sky-600',
      iconBgClassName: 'bg-sky-50',
    }
  }
  if (pathname.startsWith('/odoo/quotations/') && pathname !== '/odoo/quotations') {
    return {
      title: 'Dettaglio preventivo Odoo',
      description: 'Partner, righe e totali da sale.order',
      icon: FileTextIcon,
      iconClassName: 'text-cyan-600',
      iconBgClassName: 'bg-cyan-50',
    }
  }
  if (pathname.startsWith('/odoo/quotations')) {
    return {
      title: 'Preventivi Odoo',
      description: 'Preventivi draft/sent da sale.order con link al client web Odoo',
      icon: FileTextIcon,
      iconClassName: 'text-cyan-600',
      iconBgClassName: 'bg-cyan-50',
    }
  }
  if (pathname.startsWith('/odoo/pricelists')) {
    return {
      title: 'Listini Odoo',
      description: 'Listini product.pricelist da Odoo',
      icon: TagsIcon,
      iconClassName: 'text-pink-600',
      iconBgClassName: 'bg-pink-50',
    }
  }
  if (pathname.startsWith('/search-analytics')) {
    return {
      title: 'Analytics ricerca',
      description: 'Metriche aggregate e log delle ricerche catalogo storefront',
      icon: BarChart3Icon,
      iconClassName: 'text-violet-600',
      iconBgClassName: 'bg-violet-50',
    }
  }
  if (pathname.startsWith('/catalog-cache')) {
    return {
      title: 'Cache catalogo',
      description: 'Stato indice OdooCatalog e sync manuale',
      icon: RefreshCwIcon,
      iconClassName: 'text-blue-600',
      iconBgClassName: 'bg-blue-50',
    }
  }
  return { title: 'Backoffice' }
}

export { HomeIcon }
