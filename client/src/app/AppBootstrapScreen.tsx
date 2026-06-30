'use client'

import { LocaleProvider } from '@/context/locale-context'
import { SiteShell } from '@/components/site/SiteShell'
import { FALLBACK_SITE_SHELL } from '@/lib/site-shell-fallback'
import { PageFlexBody, PageFlexShell } from '@/components/layout/PageFlexShell'
import { CatalogPageSkeleton } from '@/components/site/catalog/CatalogPageSkeleton'
import {
  AccountBootstrapSkeleton,
  CategoryLandingCatalogSkeleton,
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
import { parseLocaleFromPathname } from '@/lib/locale'
import { resolveDcActiveNavId } from '@/lib/dc-static-routes'

function HubBootstrapSkeleton({ pageKey }: { pageKey: 'brand' | 'ambienti' | 'attacco' }) {
  if (pageKey === 'brand') return <BrandPageSkeleton />
  if (pageKey === 'ambienti') return <AmbientiPageSkeleton />
  return <AttaccoPageSkeleton />
}

function AuthBootstrapSkeleton({ fieldCount }: { fieldCount: number }) {
  return <AuthPageSkeleton fieldCount={fieldCount} />
}

function BootstrapPageContent({ route }: { route: BootstrapRoute }) {
  switch (route) {
    case 'home':
      return <HomePageSkeleton />

    case 'professionisti':
      return <ProfessionistiPageSkeleton />

    case 'brand':
      return <HubBootstrapSkeleton pageKey="brand" />

    case 'ambienti':
      return <HubBootstrapSkeleton pageKey="ambienti" />

    case 'attacco':
      return <HubBootstrapSkeleton pageKey="attacco" />

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
      return (
        <PageFlexShell tone="paper">
          <PageFlexBody tone="paper">
            <SectionContainer className="space-y-8 py-8 sm:py-10">
              <CategoryLandingCatalogSkeleton />
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

    case 'product':
      return <ProductDetailSkeleton />

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
      return <AuthBootstrapSkeleton fieldCount={2} />

    case 'register':
      return <AuthBootstrapSkeleton fieldCount={4} />

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
      return (
        <AccountBootstrapSkeleton>
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
        </AccountBootstrapSkeleton>
      )

    case 'account-orders':
      return (
        <AccountBootstrapSkeleton>
          <ListSkeleton />
        </AccountBootstrapSkeleton>
      )

    case 'account-order-detail':
      return (
        <AccountBootstrapSkeleton>
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
        </AccountBootstrapSkeleton>
      )

    case 'account-profile':
      return (
        <AccountBootstrapSkeleton>
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
        </AccountBootstrapSkeleton>
      )

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

function BootstrapScreenBody({ route, pathname }: { route: BootstrapRoute; pathname: string }) {
  const content = <BootstrapPageContent route={route} />

  if (
    route === 'checkout' ||
    route === 'checkout-return' ||
    route === 'checkout-result' ||
    route.startsWith('account')
  ) {
    return content
  }

  return (
    <SiteShell shell={FALLBACK_SITE_SHELL} activeNavId={resolveDcActiveNavId(pathname)}>
      {content}
    </SiteShell>
  )
}

export function AppBootstrapScreen({ pathname }: { pathname: string }) {
  const route = resolveBootstrapRoute(pathname)
  const locale = parseLocaleFromPathname(pathname)

  return (
    <LocaleProvider initialLocale={locale}>
      <BootstrapScreenBody route={route} pathname={pathname} />
    </LocaleProvider>
  )
}
