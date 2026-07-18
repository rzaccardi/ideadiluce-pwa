'use client'

import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { CatalogPageSkeleton } from '@/components/site/catalog/CatalogPageSkeleton'
import {
  AccountBootstrapSkeleton,
  CategoryLandingCatalogSkeleton,
  CategoryPageSkeleton,
  CheckoutStripeBootstrapSkeleton,
  ContentPageSkeleton,
  GuideHubPageSkeleton,
  HomePageSkeleton,
  ListSkeleton,
  ProductDetailSkeleton,
  ProfessionistiPageSkeleton,
  Skeleton,
} from '@/components/Skeleton'
import {
  AmbientiPageSkeleton,
  AttaccoPageSkeleton,
  AuthPageSkeleton,
  BrandPageSkeleton,
} from '@/components/site/skeletons'
import { WishlistPageSkeleton } from '@/components/site/skeletons/wishlist-page-skeleton'
import { CartPageSkeleton } from '@/components/cart/CartPageSkeleton'
import { ThankYouPageSkeleton } from '@/components/checkout/thank-you/ThankYouPageSkeleton'
import { GuideArticlePageSkeleton } from '@/components/site/content/guide-article/GuideArticlePageSkeleton'
import { SectionContainer } from '@/components/site/primitives'
import { resolveBootstrapRoute, type BootstrapRoute } from '@/app/bootstrapRoute'
import { extractProductSlugFromPath, resolveProductCatalogKindFromSlug } from '@/lib/product-catalog-kind'
import { stripLocalePrefix } from '@/lib/locale'

function HubSkeleton({ pageKey }: { pageKey: 'brand' | 'ambienti' | 'attacco' }) {
  if (pageKey === 'brand') return <BrandPageSkeleton />
  if (pageKey === 'ambienti') return <AmbientiPageSkeleton />
  return <AttaccoPageSkeleton />
}

function resolveCategoryLandingVariant(pathname: string): 'design' | 'technical' {
  const path = stripLocalePrefix(pathname)
  return path.includes('illuminazione-tecnica') || path.includes('prodotti-tecnici')
    ? 'technical'
    : 'design'
}

/** Solo corpo pagina account (per `account/loading.tsx` dentro AccountLayout). */
export function AccountPageContentSkeleton({ route }: { route: BootstrapRoute }) {
  if (route === 'account-orders') {
    return <ListSkeleton />
  }

  if (route === 'account-order-detail') {
    return (
      <div className="rounded-md border border-zinc-200 bg-idl-tech-panel p-4 shadow-sm shadow-zinc-950/5">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex justify-between gap-4 border-t border-idl-border/60 py-3 first:border-t-0 first:pt-0"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (route === 'account-profile') {
    return (
      <div className="w-full rounded-md border border-idl-border bg-idl-tech-panel p-4 shadow-sm shadow-idl-ink/5">
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="space-y-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
        <Skeleton className="mt-8 h-10 w-32 rounded-lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
      <div className="rounded-md border border-idl-border bg-idl-tech-panel p-4 shadow-sm shadow-idl-ink/5">
        <Skeleton className="mb-4 h-5 w-36" />
        <ListSkeleton count={3} className="border-0 shadow-none" />
      </div>
    </div>
  )
}

function AccountRouteSkeleton({ route }: { route: BootstrapRoute }) {
  return (
    <AccountBootstrapSkeleton>
      <AccountPageContentSkeleton route={route} />
    </AccountBootstrapSkeleton>
  )
}

/** Skeleton pagina (senza SiteShell) in base al pathname — usato da loading.tsx e bootstrap. */
export function BootstrapRouteSkeleton({
  pathname,
  route: routeOverride,
}: {
  pathname: string
  route?: BootstrapRoute
}) {
  const route = routeOverride ?? resolveBootstrapRoute(pathname)

  switch (route) {
    case 'home':
      return <HomePageSkeleton />

    case 'professionisti':
      return <ProfessionistiPageSkeleton />

    case 'brand':
      return <HubSkeleton pageKey="brand" />

    case 'ambienti':
      return <HubSkeleton pageKey="ambienti" />

    case 'attacco':
      return <HubSkeleton pageKey="attacco" />

    case 'guide':
      return (
        <PageFlexShell tone="paper">
          <PageFlexBody tone="paper">
            <SectionContainer className="py-8 sm:py-10">
              <GuideHubPageSkeleton />
            </SectionContainer>
          </PageFlexBody>
        </PageFlexShell>
      )

    case 'guide-article':
      return (
        <PageFlexShell tone="paper">
          <PageFlexBody tone="paper">
            <GuideArticlePageSkeleton />
          </PageFlexBody>
        </PageFlexShell>
      )

    case 'category-landing':
      return <CategoryLandingCatalogSkeleton variant={resolveCategoryLandingVariant(pathname)} />

    case 'category':
      return (
        <PageFlexShell tone="paper">
          <PageFlexBody tone="paper">
            <SectionContainer className="py-8 sm:py-10">
              <CategoryPageSkeleton />
            </SectionContainer>
          </PageFlexBody>
        </PageFlexShell>
      )

    case 'content':
      return (
        <PageFlexShell tone="paper">
          <PageFlexBody tone="paper">
            <SectionContainer className="py-8 sm:py-10">
              <ContentPageSkeleton />
            </SectionContainer>
          </PageFlexBody>
        </PageFlexShell>
      )

    case 'catalog':
      return <CatalogPageSkeleton />

    case 'product': {
      const slug = extractProductSlugFromPath(pathname)
      const variant = slug ? resolveProductCatalogKindFromSlug(slug) : 'design'
      return <ProductDetailSkeleton variant={variant} />
    }

    case 'wishlist':
      return (
        <PageFlexShell tone="paper">
          <PageFlexBody tone="paper">
            <SectionContainer className="py-8 sm:py-10">
              <WishlistPageSkeleton count={3} />
            </SectionContainer>
          </PageFlexBody>
        </PageFlexShell>
      )

    case 'cart':
      return <CartPageSkeleton />

    case 'login':
      return <AuthPageSkeleton fieldCount={2} />

    case 'register':
      return <AuthPageSkeleton fieldCount={4} />

    case 'checkout':
      return (
        <div className="checkout-root min-h-screen bg-idl-tech-panel">
          <CheckoutStripeBootstrapSkeleton />
        </div>
      )

    case 'checkout-return':
    case 'checkout-result':
      return (
        <div className="bg-idl-tech-panel">
          <ThankYouPageSkeleton />
        </div>
      )

    case 'account':
    case 'account-orders':
    case 'account-order-detail':
    case 'account-profile':
      return <AccountRouteSkeleton route={route} />

    default:
      return (
        <PageFlexShell tone="paper">
          <PageFlexBody tone="paper">
            <SectionContainer className="py-8 sm:py-10">
              <ContentPageSkeleton />
            </SectionContainer>
          </PageFlexBody>
        </PageFlexShell>
      )
  }
}
