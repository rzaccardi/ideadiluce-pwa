'use client'

import { NotFoundPageView } from '@/components/site/not-found/NotFoundPageView'
import { SeoHead } from '@/components/SeoHead'
import { StorefrontLayout } from '@/layouts/StorefrontLayout'
import { useI18n } from '@/hooks/use-i18n'

export function NotFoundPage() {
  const { t } = useI18n()

  return (
    <StorefrontLayout>
      <SeoHead title={`${t('notFound.metaTitle')} | Idea di Luce`} noindex />
      <NotFoundPageView />
    </StorefrontLayout>
  )
}
