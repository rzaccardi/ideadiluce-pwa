import type { LucideIcon } from 'lucide-react'
import {
  BarChart3Icon,
  BellRingIcon,
  BookOpenIcon,
  BriefcaseBusinessIcon,
  FileTextIcon,
  HomeIcon,
  LayoutTemplateIcon,
  MegaphoneIcon,
  SearchIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TagsIcon,
  TruckIcon,
  ReceiptIcon,
  ScrollTextIcon,
  RefreshCwIcon,
  FileDownIcon,
} from 'lucide-react'
import { getSitePageLabel } from '@/features/site'

function getSitePageLabelFromPath(pageKey: string) {
  return getSitePageLabel(pageKey)
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
    label: 'CONTENUTI',
    items: [
      {
        to: '/guides',
        label: 'Guide editoriali',
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
      {
        to: '/site',
        label: 'Contenuti sito',
        icon: LayoutTemplateIcon,
        accentClass: 'text-sky-600',
        accentBgClass: 'bg-sky-50',
        match: (p) => p.startsWith('/site'),
      },
      {
        to: '/professional-requests',
        label: 'Account professionisti',
        icon: BriefcaseBusinessIcon,
        accentClass: 'text-violet-600',
        accentBgClass: 'bg-violet-50',
        match: (p) => p.startsWith('/professional-requests'),
      },
    ],
  },
  {
    label: 'OPERAZIONI',
    items: [
      {
        to: '/orders',
        label: 'Elenco ordini',
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
      {
        to: '/odoo/quotations',
        label: 'Preventivi Odoo',
        icon: FileTextIcon,
        accentClass: 'text-cyan-600',
        accentBgClass: 'bg-cyan-50',
        match: (p) => p.startsWith('/odoo/quotations'),
      },
      {
        to: '/odoo/pricelists',
        label: 'Listini Odoo',
        icon: TagsIcon,
        accentClass: 'text-pink-600',
        accentBgClass: 'bg-pink-50',
        match: (p) => p.startsWith('/odoo/pricelists'),
      },
      {
        to: '/integration-logs',
        label: 'Log integrazioni',
        icon: ScrollTextIcon,
        accentClass: 'text-slate-600',
        accentBgClass: 'bg-slate-50',
        match: (p) => p.startsWith('/integration-logs'),
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
        to: '/document-downloads',
        label: 'Download documenti',
        icon: FileDownIcon,
        accentClass: 'text-stone-600',
        accentBgClass: 'bg-stone-50',
        match: (p) => p.startsWith('/document-downloads'),
      },
      {
        to: '/sync-queue',
        label: 'Coda sync Odoo',
        icon: RefreshCwIcon,
        accentClass: 'text-blue-600',
        accentBgClass: 'bg-blue-50',
        match: (p) => p.startsWith('/sync-queue'),
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
]

export type BreadcrumbItem = { label: string; href?: string }

export function getBreadcrumbs(pathname: string, _search = ''): BreadcrumbItem[] {
  if (pathname.startsWith('/orders/') && pathname !== '/orders') {
    return [
      { label: 'Elenco ordini', href: '/orders' },
      { label: 'Dettaglio ordine' },
    ]
  }
  if (pathname.startsWith('/orders')) {
    return [
      { label: 'Elenco ordini', href: '/orders' },
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
      { label: 'Account professionisti', href: '/professional-requests' },
      { label: 'Dettaglio richiesta' },
    ]
  }
  if (pathname.startsWith('/professional-requests')) {
    return [
      { label: 'Account professionisti', href: '/professional-requests' },
      { label: 'Richieste attivazione B2B dalla PWA' },
    ]
  }
  if (pathname.startsWith('/guides/') && pathname !== '/guides') {
    const slug = decodeURIComponent(pathname.slice('/guides/'.length).split('/')[0] ?? '')
    return [
      { label: 'Guide editoriali', href: '/guides' },
      { label: slug.replace(/-/g, ' ') },
    ]
  }
  if (pathname.startsWith('/guides')) {
    return [
      { label: 'Guide editoriali', href: '/guides' },
      { label: 'Elenco guide' },
    ]
  }
  if (pathname.startsWith('/seo/migration/') && pathname !== '/seo/migration') {
    return [
      { label: 'SEO e feed', href: '/seo' },
      { label: 'Migrazione WordPress', href: '/seo/migration' },
      { label: 'Dettaglio export' },
    ]
  }
  if (pathname.startsWith('/seo/migration')) {
    return [
      { label: 'SEO e feed', href: '/seo' },
      { label: 'Migrazione WordPress' },
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
      { label: 'Contenuti sito', href: '/site' },
      { label: getSitePageLabelFromPath(pageKey) },
    ]
  }
  if (pathname.startsWith('/site')) {
    return [
      { label: 'Contenuti sito', href: '/site' },
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
      { label: 'Listini e assegnazioni partner' },
    ]
  }
  if (pathname.startsWith('/integration-logs')) {
    return [
      { label: 'Log integrazioni', href: '/integration-logs' },
      { label: 'Chiamate verso Odoo e servizi esterni' },
    ]
  }
  if (pathname.startsWith('/search-analytics')) {
    return [
      { label: 'Analytics ricerca', href: '/search-analytics' },
      { label: 'Query catalogo e trend di mercato' },
    ]
  }
  if (pathname.startsWith('/document-downloads')) {
    return [
      { label: 'Download documenti', href: '/document-downloads' },
      { label: 'Tracciamento schede tecniche PDP' },
    ]
  }
  if (pathname.startsWith('/sync-queue')) {
    return [
      { label: 'Coda sync Odoo', href: '/sync-queue' },
      { label: 'Retry sync post-pagamento' },
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
      title: 'Elenco ordini',
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
      title: 'Account professionisti',
      description: 'Richieste attivazione B2B inviate dalla pagina /professionisti',
      icon: BriefcaseBusinessIcon,
      iconClassName: 'text-violet-600',
      iconBgClassName: 'bg-violet-50',
    }
  }
  if (pathname.startsWith('/guides/') && pathname !== '/guides') {
    const slug = decodeURIComponent(pathname.slice('/guides/'.length).split('/')[0] ?? '')
    return {
      title: slug.replace(/-/g, ' '),
      description: 'Contenuto, traduzioni e indicizzazione della guida',
      icon: BookOpenIcon,
      iconClassName: 'text-amber-700',
      iconBgClassName: 'bg-amber-50',
    }
  }
  if (pathname.startsWith('/guides')) {
    return {
      title: 'Guide editoriali',
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
      title: 'Contenuti sito',
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
      description: 'Listini product.pricelist e assegnazione su res.partner',
      icon: TagsIcon,
      iconClassName: 'text-pink-600',
      iconBgClassName: 'bg-pink-50',
    }
  }
  if (pathname.startsWith('/integration-logs')) {
    return {
      title: 'Log integrazioni',
      description: 'Chiamate verso Odoo, VIES e servizi esterni',
      icon: ScrollTextIcon,
      iconClassName: 'text-slate-600',
      iconBgClassName: 'bg-slate-50',
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
  if (pathname.startsWith('/document-downloads')) {
    return {
      title: 'Download documenti',
      description: 'Tracciamento schede tecniche e datasheet dalle PDP',
      icon: FileDownIcon,
      iconClassName: 'text-stone-600',
      iconBgClassName: 'bg-stone-50',
    }
  }
  if (pathname.startsWith('/sync-queue')) {
    return {
      title: 'Coda sync Odoo',
      description: 'Retry automatici sync Odoo post-pagamento',
      icon: RefreshCwIcon,
      iconClassName: 'text-blue-600',
      iconBgClassName: 'bg-blue-50',
    }
  }
  return { title: 'Backoffice' }
}

export { HomeIcon }
