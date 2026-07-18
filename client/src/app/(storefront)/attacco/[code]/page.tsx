import { permanentRedirect } from 'next/navigation'

const CODE_ALIASES: Record<string, string> = {
  'gu5-3': 'GU5.3',
  gu53: 'GU5.3',
  r7s: 'R7s',
  g13: 'G13',
  t8: 'G13',
  gx53: 'GX53',
  '2g11': '2G11',
  g24: 'G24',
}

type PageProps = {
  params: Promise<{ code: string }>
}

export default async function AttaccoCodePage({ params }: PageProps) {
  const { code } = await params
  const key = code.trim().toLowerCase()
  const query = CODE_ALIASES[key] ?? code.toUpperCase()
  permanentRedirect(`/negozio?world=technical&q=${encodeURIComponent(query)}`)
}
