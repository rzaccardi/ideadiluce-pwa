import { redirect } from 'next/navigation'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

/** Redirect legacy /catalogo → /negozio (301 via Next redirect). */
export default async function CatalogoLegacyRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      for (const item of value) qs.append(key, item)
    } else {
      qs.set(key, value)
    }
  }
  const query = qs.toString()
  redirect(query ? `/negozio?${query}` : '/negozio')
}
