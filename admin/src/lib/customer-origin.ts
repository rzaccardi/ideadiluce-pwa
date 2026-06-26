import type { CustomerAdminOrigin, CustomerAdminOriginFilter } from '@/types/customers'

export const CUSTOMER_ORIGIN_FILTER_OPTIONS: Array<{
  value: CustomerAdminOriginFilter
  label: string
}> = [
  { value: 'all', label: 'Tutti i tipi' },
  { value: 'ecommerce', label: 'E-commerce (PWA)' },
  { value: 'both', label: 'Entrambi' },
  { value: 'pwa_only', label: 'Solo PWA' },
  { value: 'odoo_only', label: 'Solo Odoo' },
  { value: 'guest', label: 'Guest checkout' },
]

export function customerOriginBadgeClass(origin: CustomerAdminOrigin): string {
  switch (origin) {
    case 'both':
      return 'border-sky-200 bg-sky-50 text-sky-800'
    case 'pwa_only':
      return 'border-indigo-200 bg-indigo-50 text-indigo-800'
    case 'odoo_only':
      return 'border-purple-200 bg-purple-50 text-purple-800'
    case 'guest':
      return 'border-amber-200 bg-amber-50 text-amber-900'
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700'
  }
}
