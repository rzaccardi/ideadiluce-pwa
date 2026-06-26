'use client'

import { useEffect, useState } from 'react'
import { api } from '@/api/endpoints'
import type { ProductSocialProofDTO } from '@/types/dto'
import { useI18n } from '@/hooks/use-i18n'

type Props = {
  slug: string
  className?: string
}

export function ProductDemandBadge({ slug, className }: Props) {
  const { tParams } = useI18n()
  const [data, setData] = useState<ProductSocialProofDTO | null>(null)

  useEffect(() => {
    let cancelled = false
    void api.catalog
      .socialProof(slug)
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [slug])

  if (!data?.enabled) return null

  let message: string | null = null
  if (data.unitsSoldLast30Days >= 3) {
    message = tParams('product.demand.unitsSold', { count: data.unitsSoldLast30Days })
  } else if (data.buyersLast30Days >= 2) {
    message = tParams('product.demand.recentBuyers', { count: data.buyersLast30Days })
  }

  if (!message) return null

  return (
    <p className={className ?? 'mt-2 text-sm font-medium text-emerald-700'}>{message}</p>
  )
}
