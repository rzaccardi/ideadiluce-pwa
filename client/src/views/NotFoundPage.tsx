'use client'

import { NotFoundPageView } from '@/components/site/not-found/NotFoundPageView'
import { StorefrontLayout } from '@/layouts/StorefrontLayout'

export function NotFoundPage() {
  return (
    <StorefrontLayout>
      <NotFoundPageView />
    </StorefrontLayout>
  )
}
