'use client'

import { notFound } from 'next/navigation'
import { use } from 'react'
import { ContentPage } from '@/views/ContentPage'
import { guidePageKeyFromSlug } from '@/lib/site-page-keys'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default function GuideArticlePage({ params }: PageProps) {
  const { slug } = use(params)
  const pageKey = guidePageKeyFromSlug(slug)
  if (!pageKey) notFound()

  return <ContentPage pageKey={pageKey} />
}
