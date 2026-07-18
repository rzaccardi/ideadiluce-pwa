'use client'

import { LocaleProvider } from '@/context/locale-context'
import { SiteShell } from '@/components/site/SiteShell'
import { FALLBACK_SITE_SHELL } from '@/lib/site-shell-fallback'
import { BootstrapRouteSkeleton } from '@/components/site/skeletons/BootstrapRouteSkeleton'
import { resolveBootstrapRoute } from '@/app/bootstrapRoute'
import { parseLocaleFromPathname } from '@/lib/locale'
import { resolveDcActiveNavId } from '@/lib/dc-static-routes'

function BootstrapScreenBody({ pathname }: { pathname: string }) {
  const route = resolveBootstrapRoute(pathname)
  const content = <BootstrapRouteSkeleton pathname={pathname} route={route} />

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
  const locale = parseLocaleFromPathname(pathname)

  return (
    <LocaleProvider initialLocale={locale}>
      <BootstrapScreenBody pathname={pathname} />
    </LocaleProvider>
  )
}
