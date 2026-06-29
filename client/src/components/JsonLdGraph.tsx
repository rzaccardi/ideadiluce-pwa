import { JsonLd } from '@/components/JsonLd'

export function JsonLdGraph({ items }: { items: Array<Record<string, unknown> | null | undefined> }) {
  const data = items.filter(Boolean) as Record<string, unknown>[]
  if (!data.length) return null
  if (data.length === 1) return <JsonLd data={data[0]} />
  return <JsonLd data={{ '@context': 'https://schema.org', '@graph': data }} />
}
