import { isCartFlowPath } from '@/features/cart/cart.utils'
import { stripLocalePrefix } from '@/lib/locale'

export const WHATSAPP_PHONE = '39067167111'

/** Apre l'app WhatsApp su mobile e la chat web su desktop. */
export const WHATSAPP_URL = `https://wa.me/${WHATSAPP_PHONE}`

/** Colori ufficiali WhatsApp Brand. */
export const WHATSAPP_COLORS = {
  green: '#25D366',
  greenDark: '#128C7E',
  greenHover: '#20BD5A',
  teal: '#075E54',
} as const

const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/impersonate',
] as const

function normalizePath(pathname: string): string {
  const path = stripLocalePrefix(pathname)
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

/** Bolla WhatsApp visibile ovunque tranne checkout, carrello e pagine di flusso critico. */
export function shouldShowWhatsAppBubble(pathname: string): boolean {
  if (isCartFlowPath(pathname)) return false

  const normalized = normalizePath(pathname)
  return !HIDDEN_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  )
}

/** PDP con sticky bar in basso: la bolla va alzata per non coprire "Aggiungi al carrello". */
export function isProductDetailPath(pathname: string): boolean {
  const normalized = normalizePath(pathname)
  return normalized.startsWith('/prodotto/') || normalized.startsWith('/product/')
}
