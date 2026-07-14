import {
  generateWpCategoryProdottoMetadata,
  WpCategoryProdottoRoute,
} from '@/app/_shared/wp-category-prodotto-route'

type PageProps = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata(props: PageProps) {
  const { segments } = await props.params
  const searchParams = await props.searchParams
  return generateWpCategoryProdottoMetadata({ segments, searchParams })
}

/** Serve contenuto reale su URL WordPress indicizzati /categoria-prodotto/... */
export default async function CategoriaProdottoCatchAllPage(props: PageProps) {
  const { segments } = await props.params
  return <WpCategoryProdottoRoute segments={segments} />
}
