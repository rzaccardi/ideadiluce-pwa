'use client'

import { useSnapshot } from 'valtio/react'
import { appStore, DEFAULT_LEGACY_SITE_URL } from '@/features/app'
import { ExternalLink } from '@/lib/link-title'
import { useI18n } from '@/hooks/use-i18n'
import { cn } from '@/utils/cn'
import { SectionContainer } from './primitives'

function useLegacySiteUrl() {
  const app = useSnapshot(appStore)
  return app.legacySiteUrl.trim() || DEFAULT_LEGACY_SITE_URL
}

const legacyLinkProps = {
  target: '_blank' as const,
  rel: 'noopener noreferrer',
}

export function LegacySiteNoticeBanner() {
  const app = useSnapshot(appStore)
  const url = useLegacySiteUrl()
  const { t } = useI18n()
  if (!app.legacySiteNoticeEnabled) return null

  return (
    <div
      role="status"
      className="border-b border-white/10 bg-idl-design text-idl-design-fg dark:border-idl-glow/25 dark:bg-idl-design-elevated"
    >
      <SectionContainer className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[13px] leading-snug sm:text-[13.5px]">{t('legacySite.notice.message')}</p>
        <ExternalLink
          href={url}
          {...legacyLinkProps}
          className="inline-flex shrink-0 items-center justify-center rounded-md bg-idl-glow px-3 py-1.5 text-[12.5px] font-bold text-[#0c0c0d] transition hover:bg-idl-cta-glow-hover"
        >
          {t('legacySite.notice.cta')}
        </ExternalLink>
      </SectionContainer>
    </div>
  )
}

export function LegacySiteNoticeInline({ className }: { className?: string }) {
  const app = useSnapshot(appStore)
  const url = useLegacySiteUrl()
  const { t } = useI18n()
  if (!app.legacySiteNoticeEnabled) return null

  return (
    <div
      role="status"
      className={cn(
        'mb-4 rounded-xl border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-idl-glow/30 dark:bg-idl-design-elevated dark:text-idl-design-fg',
        className,
      )}
    >
      <p>{t('legacySite.checkout.hint')}</p>
      <ExternalLink
        href={url}
        {...legacyLinkProps}
        className="mt-2 inline-flex font-semibold text-amber-950 underline decoration-amber-700/60 underline-offset-2 hover:decoration-amber-950 dark:text-idl-glow dark:decoration-idl-glow/50 dark:hover:text-idl-cta-glow-hover dark:hover:decoration-idl-glow"
      >
        {t('legacySite.notice.cta')}
      </ExternalLink>
    </div>
  )
}

/** Sempre visibile in footer: il link «sito precedente» deve essere individuabile anche se il banner è spento. */
export function LegacySiteFooterLink() {
  const url = useLegacySiteUrl()
  const { t } = useI18n()

  return (
    <p className="pt-2">
      <ExternalLink href={url} {...legacyLinkProps} className="text-idl-glow hover:text-idl-design-fg">
        {t('legacySite.footer.link')}
      </ExternalLink>
    </p>
  )
}
