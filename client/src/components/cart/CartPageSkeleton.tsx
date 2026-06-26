'use client'

import { CartHeroSection } from '@/components/cart/CartHeroSection'
import { CartPageBody, CartPageShell } from '@/components/cart/CartPageShell'
import { SectionContainer } from '@/components/site/primitives'
import { CartItemsSkeleton, CartSummarySkeleton } from '@/components/Skeleton'

export function CartPageSkeleton() {
  return (
    <CartPageShell>
      <CartHeroSection itemCount={0} />
      <CartPageBody>
        <SectionContainer className="py-6 sm:py-8 lg:py-10">
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-8">
            <CartItemsSkeleton variant="page" />
            <CartSummarySkeleton showCheckoutCta variant="page" />
          </div>
        </SectionContainer>
      </CartPageBody>
    </CartPageShell>
  )
}
