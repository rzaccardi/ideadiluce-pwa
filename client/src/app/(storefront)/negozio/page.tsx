import { CatalogRoutePage, generateCatalogMetadata } from '@/app/_shared/catalog-route'

export const revalidate = 1800

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(props: PageProps) {
  return generateCatalogMetadata(props)
}

export default function Page(props: PageProps) {
  return CatalogRoutePage(props)
}
