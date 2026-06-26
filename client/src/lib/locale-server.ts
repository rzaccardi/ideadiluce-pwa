import { headers } from 'next/headers'
import { LOCALE_HEADER } from '@/middleware'
import { parseLocaleFromHeader } from '@/lib/locale'

export async function getRequestLocale() {
  const h = await headers()
  return parseLocaleFromHeader(h.get(LOCALE_HEADER))
}
