'use client'

import { Link } from '@/lib/navigation'
import type { CartDTO, CartItemDTO, CartStockInsufficientDTO, ProductCardDTO } from '@/types/dto'
import { clearCart } from '@/features/cart'
import { CartCompatibilitySupport } from '@/components/cart/CartCompatibilitySupport'
import { CartFreeShippingBanner } from '@/components/cart/CartFreeShippingBanner'
import { CartHeroSection } from '@/components/cart/CartHeroSection'
import { CartLineItem } from '@/components/cart/CartLineItem'
import { CartRecommendationsSection } from '@/components/cart/CartRecommendationsSection'
import { CartReservationExpiredBanner } from '@/components/cart/CartReservationExpiredBanner'
import { CartSummary } from '@/components/cart/CartSummary'
import { EmptyCartPrompt } from '@/components/cart/EmptyCartPrompt'
import { CartPageBody, CartPageShell } from '@/components/cart/CartPageShell'
import { SectionContainer } from '@/components/site/primitives'
import { ToastOnError } from '@/components/ToastFeedback'
import { cartHasBlockedLines, cartPurchasableItemCount } from '@/lib/cartTotals'
import { useLocalePath } from '@/hooks/use-locale-path'
import { useI18n } from '@/hooks/use-i18n'

type CartLike = {
  cart: (Omit<CartDTO, 'items' | 'warnings'> & {
    items: ReadonlyArray<CartItemDTO>
    warnings?: ReadonlyArray<string>
  }) | null
  recommendations: ReadonlyArray<ProductCardDTO>
  isRecommendationsLoading: boolean
  recommendationsError: string | null
  stockInsufficient: ReadonlyArray<CartStockInsufficientDTO>
  isLoading: boolean
  error: string | null
}

type Props = {
  state: CartLike
}

export function CartPageView({ state }: Props) {
  const lp = useLocalePath()
  const { t } = useI18n()
  const cart = state.cart

  if (!cart || cart.items.length === 0) {
    return (
      <CartPageShell>
        <CartHeroSection itemCount={0} />
        <CartPageBody>
          <SectionContainer className="py-7 sm:py-8">
            <CartReservationExpiredBanner className="mb-6" />
            <EmptyCartPrompt showSuggestions />
          </SectionContainer>
        </CartPageBody>
      </CartPageShell>
    )
  }

  const purchasableCount = cartPurchasableItemCount(cart)
  const hasBlockedLines = cartHasBlockedLines(cart)
  const checkoutDisabled =
    purchasableCount === 0 || hasBlockedLines || state.stockInsufficient.length > 0

  return (
    <CartPageShell>
      <CartHeroSection itemCount={cart.itemCount} />

      <CartPageBody>
        <SectionContainer className="py-6 sm:py-8 lg:py-10">
        <CartReservationExpiredBanner className="mb-5" />
        <ToastOnError message={state.error} />

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_372px] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-[18px]">
            <CartFreeShippingBanner hint={cart.freeShippingHint} currencyCode={cart.currencyCode} />

            <div className="overflow-hidden rounded-[14px] border border-idl-tech-border bg-white">
              {cart.items.map((line, index) => (
                <CartLineItem
                  key={line.id}
                  line={line}
                  currencyCode={cart.currencyCode}
                  stockInsufficient={state.stockInsufficient}
                  isLoading={state.isLoading}
                  isLast={index === cart.items.length - 1}
                />
              ))}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={state.isLoading}
                onClick={() => void clearCart()}
                className="text-sm font-medium text-idl-muted transition hover:text-idl-graphite disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('cart.clear')}
              </button>
            </div>

            <CartRecommendationsSection
              products={state.recommendations}
              isLoading={state.isRecommendationsLoading}
              error={state.recommendationsError}
            />

            <Link
              to={lp('/catalogo')}
              className="inline-flex items-center gap-2 text-sm font-bold text-idl-muted transition hover:text-idl-graphite"
            >
              ← {t('cart.continueShopping')}
            </Link>
          </div>

          <div className="sticky top-6 flex min-w-0 flex-col gap-4">
            <CartSummary
              cart={cart}
              showCheckoutCta
              checkoutDisabled={checkoutDisabled}
              noPurchasableLines={purchasableCount === 0}
              hasBlockedLines={hasBlockedLines}
            />
            <CartCompatibilitySupport />
          </div>
        </div>
        </SectionContainer>
      </CartPageBody>
    </CartPageShell>
  )
}
