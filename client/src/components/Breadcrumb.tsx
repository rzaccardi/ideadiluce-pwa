'use client'

import { Link } from '@/lib/navigation'
import { useI18n } from '@/hooks/use-i18n'
import { useLocalePath } from '@/hooks/use-locale-path'

export type BreadcrumbItem = {
  label: string
  to?: string
}

type Props = {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: Props) {
  const { t } = useI18n()
  const lp = useLocalePath()

  if (!items.length) return null

  return (
    <nav aria-label={t('breadcrumb.nav')} className="mb-4 text-sm text-idl-muted">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link to={lp('/')} className="transition hover:text-idl-graphite">
            {t('breadcrumb.home')}
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1">
            <span aria-hidden className="text-idl-border-strong">
              /
            </span>
            {item.to ? (
              <Link to={item.to} className="transition hover:text-idl-graphite">
                {item.label}
              </Link>
            ) : (
              <span className="text-idl-graphite" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
