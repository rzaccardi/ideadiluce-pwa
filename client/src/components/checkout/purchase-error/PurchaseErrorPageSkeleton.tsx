'use client'

import { SectionContainer } from '@/components/site/primitives'
import { Skeleton } from '@/components/Skeleton'
import { useI18n } from '@/hooks/use-i18n'

export function PurchaseErrorPageSkeleton() {
  const { t } = useI18n()

  return (
    <div className="bg-white" role="status" aria-label={t('paymentResult.loading')}>
      <SectionContainer className="max-w-[1100px] py-4">
        <Skeleton className="h-8 w-40" />
      </SectionContainer>
      <SectionContainer className="max-w-[1100px] py-12 text-center">
        <Skeleton className="mx-auto size-[78px] rounded-full" />
        <Skeleton className="mx-auto mt-6 h-3 w-44" />
        <Skeleton className="mx-auto mt-4 h-9 w-full max-w-xl" />
        <Skeleton className="mx-auto mt-3 h-4 w-full max-w-lg" />
        <div className="mx-auto mt-6 flex justify-center gap-3">
          <Skeleton className="h-12 w-44 rounded-[10px]" />
          <Skeleton className="h-12 w-40 rounded-[10px]" />
        </div>
      </SectionContainer>
      <SectionContainer className="max-w-[1100px] pb-14">
        <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            <Skeleton className="h-72 w-full rounded-[14px]" />
            <Skeleton className="h-44 w-full rounded-[14px]" />
            <Skeleton className="h-32 w-full rounded-[14px]" />
          </div>
          <Skeleton className="h-[520px] w-full rounded-[14px]" />
        </div>
      </SectionContainer>
    </div>
  )
}
