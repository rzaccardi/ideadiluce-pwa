import { generateIlluminazioneArredoMetadata, IlluminazioneArredoRoutePage } from '@/app/_shared/illuminazione-arredo-route'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(props: PageProps) {
  return generateIlluminazioneArredoMetadata(props)
}

export default function Page() {
  return <IlluminazioneArredoRoutePage />
}
