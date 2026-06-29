import { CategoryListRoute, generateCategoryMetadata, revalidate } from '@/app/_shared/category-list-route'

type PageProps = {
  params: Promise<{ slug: string }>
}

export { revalidate }

export async function generateMetadata(props: PageProps) {
  return generateCategoryMetadata(props)
}

export default function Page(props: PageProps) {
  return CategoryListRoute(props)
}
