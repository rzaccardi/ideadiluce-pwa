import { permanentRedirect } from 'next/navigation'
import { localizePath } from '@/lib/locale'
import { getRequestLocale } from '@/lib/locale-server'

/** Alias legacy: `/illuminazione-tecnica` → landing tecnica canonica. */
export default async function IlluminazioneTecnicaRedirectPage() {
  const locale = await getRequestLocale()
  permanentRedirect(localizePath('/categoria-prodotto/illuminazione-tecnica', locale))
}
