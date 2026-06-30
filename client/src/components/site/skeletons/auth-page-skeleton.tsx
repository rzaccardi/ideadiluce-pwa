'use client'

import { Skeleton } from '@/components/skeleton-primitive'
import { useI18n } from '@/hooks/use-i18n'
import { siteAuth } from '@/styles/site-ui'

export function AuthPageSkeleton({ fieldCount = 2 }: { fieldCount?: number }) {
  const { t } = useI18n()

  return (
    <div className={siteAuth.shell} role="status" aria-label={t('skeleton.loadingForm')}>
      <div className={siteAuth.glow} aria-hidden>
        <div className={siteAuth.glowOrb} />
      </div>
      <div className={siteAuth.cardInner}>
        <div className={siteAuth.card}>
          <div className="mb-6 text-center sm:mb-8">
            <Skeleton className="mx-auto mb-4 size-12 rounded-full sm:mb-[18px] sm:size-14" />
            <Skeleton className="mx-auto h-8 w-48" />
            <Skeleton className="mx-auto mt-2 h-4 w-64" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: fieldCount }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            ))}
            {fieldCount === 2 ? (
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <Skeleton className="h-5 w-full max-w-sm" />
            )}
            <Skeleton className="h-12 w-full rounded-idl-md" />
          </div>
        </div>

        <div className="mt-5 space-y-2.5 text-center sm:mt-[22px]">
          <Skeleton className="mx-auto h-4 w-56" />
          <Skeleton className="mx-auto h-4 w-72" />
        </div>
      </div>
    </div>
  )
}
